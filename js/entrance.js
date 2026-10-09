/* Entrance page: typed greeting, endless code drift, and the hand-off to the chosen page. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stage = document.getElementById("stage");

  /* Each code column holds one copy of its text. Doubling it lets the drift loop without a visible jump. */
  document.querySelectorAll(".codefall pre").forEach(function (pre) {
    pre.textContent = pre.textContent + "\n\n" + pre.textContent;
  });

  /* Typed greeting. The full sentence stays available to screen readers through aria-label. */
  var greet = document.getElementById("greet");
  var full = greet.textContent.trim();
  if (!reduce) {
    var typed = document.createElement("span");
    var caret = document.createElement("span");
    caret.className = "caret";
    typed.setAttribute("aria-hidden", "true");
    caret.setAttribute("aria-hidden", "true");
    greet.setAttribute("aria-label", full);
    greet.textContent = "";
    greet.appendChild(typed);
    greet.appendChild(caret);
    var count = 0;
    var tick = function () {
      count += 1;
      typed.textContent = full.slice(0, count);
      if (count < full.length) {
        window.setTimeout(tick, 34 + Math.random() * 36);
      } else {
        window.setTimeout(function () {
          caret.className = "caret is-done";
        }, 700);
      }
    };
    window.setTimeout(tick, 450);
  }

  /* Choosing a card plays a short exit, then opens the page. Modified clicks (new tab) are left alone. */
  document.querySelectorAll(".choice").forEach(function (card) {
    card.addEventListener("click", function (event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      card.classList.add("is-chosen");
      stage.classList.add("is-leaving");
      window.setTimeout(
        function () {
          window.location.href = card.href;
        },
        reduce ? 0 : 520,
      );
    });
  });

  /* Coming back with the Back button restores the page from memory, so undo the exit. */
  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    stage.classList.remove("is-leaving");
    document.querySelectorAll(".choice").forEach(function (card) {
      card.classList.remove("is-chosen");
    });
  });
})();
