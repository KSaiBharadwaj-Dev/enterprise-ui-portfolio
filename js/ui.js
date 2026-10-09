/* UI skills page: connects the "Try it" and "Read the code" buttons
   to the demo and to the source explorer. */
(function () {
  "use strict";
  var $ = function (id) {
    return document.getElementById(id);
  };

  /* The demo needs React from the CDN. If it did not load, say so instead of leaving a blank box. */
  if (!window.React || !window.ReactDOM) {
    var root = $("lab-root");
    root.textContent = "";
    var message = document.createElement("p");
    message.className = "lab-loading";
    message.textContent =
      "The live demo needs React from cdnjs.cloudflare.com, and it did not load. Reload the page, or try a network that can reach that host.";
    root.appendChild(message);
  }

  /* "Try it" opens a demo tab, scrolls to the demo and puts focus on the tab. */
  document.querySelectorAll("[data-try]").forEach(function (button) {
    button.addEventListener("click", function () {
      var name = button.dataset.try;
      window.dispatchEvent(new CustomEvent("lab:open", { detail: name }));
      $("lab").scrollIntoView();
      var tab = document.getElementById("lab-tab-" + name);
      if (tab) tab.focus({ preventScroll: true });
    });
  });

  /* "Read the code" opens the explorer on one skill. The value looks like "tsx:session". */
  document.querySelectorAll("[data-code]").forEach(function (button) {
    button.addEventListener("click", function () {
      var parts = button.dataset.code.split(":");
      window.SourceViewer.open(parts[0], parts[1]);
    });
  });
})();
