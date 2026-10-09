/* Untrusted text: the same input shown escaped, sanitized, and as sanitized HTML. */
import { useEffect, useId, useMemo, useRef, useState } from "../react";
import { sanitize } from "../sanitize";

const SAMPLE =
  'Quarterly note: <b>on track</b>. <img src=x onerror="alert(1)"> <script>alert(1)</script> <a href="javascript:alert(1)">bad link</a> and <a href="https://example.com/report">a safe link</a>.';

export function SanitizerDemo() {
  const [text, setText] = useState(SAMPLE);
  const preview = useRef<HTMLDivElement>(null);
  const id = useId();
  const clean = useMemo(() => sanitize(text), [text]);
  const source = useMemo(() => {
    const holder = document.createElement("div");
    holder.appendChild(clean.fragment.cloneNode(true));
    return holder.innerHTML; // only serializes; shown as text below
  }, [clean]);
  useEffect(() => {
    preview.current?.replaceChildren(clean.fragment.cloneNode(true));
  }, [clean]);
  return (
    <div className="lab-card lab-wide">
      <h3>Untrusted text</h3>
      <div className="lab-field">
        <label htmlFor={id}>Paste anything, including markup</label>
        <textarea
          id={id}
          rows={3}
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="lab-outputs">
        <div>
          <h4>As plain text</h4>
          <p className="lab-out">{text}</p>
          <p className="lab-hint">React escapes this by default.</p>
        </div>
        <div>
          <h4>After the sanitizer</h4>
          <div className="lab-out" ref={preview} />
          <p className="lab-hint">
            {clean.blocked.length
              ? `Blocked: ${clean.blocked.join(", ")}.`
              : "Nothing needed blocking."}
          </p>
        </div>
        <div>
          <h4>Sanitized HTML</h4>
          <pre className="lab-pre">{source}</pre>
        </div>
      </div>
    </div>
  );
}
