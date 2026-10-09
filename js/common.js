/* Shared helpers for every page. Plain JavaScript, no build step. */
(function () {
  "use strict";
  var S = window.SITE || {};

  /* Build DOM nodes without innerHTML, so text from the data files can never become markup. */
  function h(tag, props, children) {
    var node = document.createElement(tag);
    Object.keys(props || {}).forEach(function (key) {
      var value = props[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.slice(0, 2) === "on") node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    [].concat(children || []).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  /* An external link that cannot reach back into this page. */
  function external(text, href, cls) {
    return h("a", {
      href: href,
      class: cls || "",
      target: "_blank",
      rel: "noopener noreferrer",
      text: text,
    });
  }

  /* Copy text. Clipboard access can be refused, so fall back to selecting it. */
  function copyText(button, text, node, idle) {
    function done(message) {
      button.textContent = message;
      window.setTimeout(function () {
        button.textContent = idle;
      }, 1800);
    }
    function fallback() {
      if (!node) return done("Press Ctrl+C");
      var range = document.createRange();
      range.selectNodeContents(node);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      done("Selected");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        done("Copied");
      }, fallback);
    } else {
      fallback();
    }
  }

  /* Fill the places marked in the HTML from data/settings.js, and hide links that have no value yet. */
  var LINKS = {
    email: function (v) {
      return "mailto:" + v;
    },
    linkedin: function (v) {
      return v;
    },
    github: function (v) {
      return "https://github.com/" + v;
    },
    siteRepo: function (v) {
      return "https://github.com/" + v;
    },
    resumeUrl: function (v) {
      return v;
    },
  };
  document.querySelectorAll("[data-site]").forEach(function (node) {
    node.textContent = S[node.getAttribute("data-site")] || "";
  });
  document.querySelectorAll("[data-site-link]").forEach(function (node) {
    var key = node.getAttribute("data-site-link");
    var value = S[key];
    if (!value) {
      node.hidden = true;
      return;
    }
    node.href = LINKS[key](value);
    if (key !== "email") {
      node.target = "_blank";
      node.rel = "noopener noreferrer";
    }
  });
  document.querySelectorAll("[data-site-show]").forEach(function (node) {
    node.hidden = !S[node.getAttribute("data-site-show")];
  });
  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  window.SiteUtil = { h: h, external: external, copyText: copyText };
})();
