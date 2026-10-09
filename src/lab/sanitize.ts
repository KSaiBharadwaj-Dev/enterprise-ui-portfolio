/* Allow-list sanitizer for untrusted markup. */
import { isHttpsUrl } from "./validation";

const ALLOWED_TAGS = new Set(["B", "I", "EM", "STRONG", "A", "BR", "CODE"]);
const DROP_WITH_CONTENT = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "TEMPLATE",
  "NOSCRIPT",
  "SVG",
  "MATH",
]);

/** Attributes that run code or inject styling. They are never copied, and the report names them. */
const isRiskyAttribute = (name: string): boolean =>
  name.startsWith("on") || name === "style" || name === "srcdoc";

/** Allow-list sanitizer. It parses into an inert document, then rebuilds only safe nodes with createElement. */
export function sanitize(html: string): { fragment: DocumentFragment; blocked: string[] } {
  // Nothing in this document runs or loads. Under a strict CSP the browser may still log
  // "Refused to apply inline style" when pasted markup has a style attribute. That is the policy
  // working, and the attribute is never copied.
  const doc = new DOMParser().parseFromString(html, "text/html");
  const fragment = document.createDocumentFragment();
  const blocked: string[] = [];

  const copy = (from: Node, into: Node): void => {
    from.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        into.appendChild(document.createTextNode(node.textContent ?? ""));
        return;
      }
      if (!(node instanceof Element)) return;
      const tag = node.tagName.toUpperCase();
      node
        .getAttributeNames()
        .filter(isRiskyAttribute)
        .forEach((n) => blocked.push(`${n} attribute`));
      if (DROP_WITH_CONTENT.has(tag)) {
        blocked.push(`<${tag.toLowerCase()}> element`);
        return;
      }
      if (!ALLOWED_TAGS.has(tag)) {
        blocked.push(`<${tag.toLowerCase()}> tag`);
        copy(node, into); // keep the text, drop the wrapper
        return;
      }
      const clean = document.createElement(tag.toLowerCase());
      if (tag === "A") {
        const href = node.getAttribute("href");
        if (href !== null && isHttpsUrl(href)) {
          clean.setAttribute("href", href);
          clean.setAttribute("rel", "noopener noreferrer");
          clean.setAttribute("target", "_blank");
        } else if (href !== null) {
          blocked.push("unsafe link address");
        }
      }
      copy(node, clean);
      into.appendChild(clean);
    });
  };
  // The parser moves a leading <script> or <style> into <head>. Nothing in <head> is copied,
  // but the report should still say it was there.
  Array.from(doc.head.children).forEach((el) =>
    blocked.push(`<${el.tagName.toLowerCase()}> element`),
  );
  copy(doc.body, fragment);
  return { fragment, blocked: Array.from(new Set(blocked)) };
}
