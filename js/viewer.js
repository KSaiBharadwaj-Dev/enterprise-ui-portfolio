/* Source explorer. It reads this site's own files while the page runs and shows them with line numbers
   and syntax colors. Skill buttons jump to the lines that use a skill,
   and a button only appears when its code is found. */
(function () {
  "use strict";
  var h = window.SiteUtil.h;
  var FILES = window.SOURCE_FILES;
  var SKILLS = window.SKILL_MAP;
  var $ = function (id) {
    return document.getElementById(id);
  };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var TABS = [
    {
      id: "html",
      label: "HTML",
      lang: "xml",
      note: "The four pages. Landmarks, forms, ARIA and the Content Security Policy are all in the markup.",
    },
    {
      id: "css",
      label: "CSS",
      lang: "css",
      note: "Design tokens, light and dark themes, grid, container queries and motion preferences. No framework.",
    },
    {
      id: "js",
      label: "JavaScript",
      lang: "javascript",
      note: "Plain JavaScript with no build step: rendering from data files, the GitHub client, the contact form and this viewer.",
    },
    {
      id: "tsx",
      label: "React + TypeScript",
      lang: "typescript",
      note: "Strict TypeScript and React, split into modules. The demo above runs the compiled output of exactly these files.",
    },
    {
      id: "ng",
      label: "Angular",
      lang: "typescript",
      note: "The same patterns the Angular way. These files pass the strict Angular compiler, but they are source only and do not run on this page.",
    },
  ];
  var texts = {};
  var rendered = {};
  var current = { tab: "tsx", file: "" };
  var lastFile = {};
  var located = {};
  var chipById = {};
  var loading = null;

  /* ---------- Loading ---------- */

  function setStatus(state) {
    var node = $("source-status");
    node.dataset.state = state;
    node.textContent =
      state === "live"
        ? "Read live from this site's files, just now."
        : "Showing a bundled copy of the files, because they could not be read live. This happens when the page is opened from disk.";
  }

  function fetchText(path) {
    return fetch(path, { cache: "no-cache" }).then(function (response) {
      if (!response.ok) throw new Error(path + " answered " + response.status);
      return response.text();
    });
  }

  /* Opened from disk, browsers refuse fetch(). A generated snapshot of the same files fills the gap. */
  function loadSnapshot() {
    return new Promise(function (resolve) {
      var script = document.createElement("script");
      script.src = "js/source-snapshot.js";
      script.onload = function () {
        resolve(window.SOURCE_SNAPSHOT || {});
      };
      script.onerror = function () {
        resolve({});
      };
      document.head.appendChild(script);
    });
  }

  function loadSources() {
    if (loading) return loading;
    var all = [];
    TABS.forEach(function (tab) {
      all = all.concat(FILES[tab.id]);
    });
    // Browsers refuse fetch() on file: pages, so skip the attempt there and go straight to the bundled copy.
    var attempt = window.location.protocol === "file:" ? [] : all;
    loading = Promise.all(
      attempt.map(function (path) {
        return fetchText(path).then(
          function (text) {
            texts[path] = text.replace(/\s+$/, "");
          },
          function () {
            /* handled below */
          },
        );
      }),
    ).then(function () {
      var missing = all.filter(function (path) {
        return texts[path] === undefined;
      });
      if (!missing.length) {
        setStatus("live");
        return;
      }
      return loadSnapshot().then(function (snapshot) {
        missing.forEach(function (path) {
          if (typeof snapshot[path] === "string") texts[path] = snapshot[path].replace(/\s+$/, "");
        });
        setStatus("copy");
      });
    });
    return loading;
  }

  /* ---------- Highlighting ---------- */

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* A highlighted span can run across a line break. Close open spans at the end of each line and reopen them
     on the next, so every line stands on its own and can be numbered and highlighted. */
  function splitLines(html) {
    var open = [];
    return html.split("\n").map(function (line) {
      var prefix = open.join("");
      var tags = /<(\/?)span([^>]*)>/g;
      var match;
      while ((match = tags.exec(line))) {
        if (match[1]) open.pop();
        else open.push("<span" + match[2] + ">");
      }
      return prefix + line + new Array(open.length + 1).join("</span>");
    });
  }

  function tabOf(id) {
    return TABS.filter(function (tab) {
      return tab.id === id;
    })[0];
  }
  function tabForFile(path) {
    return TABS.filter(function (tab) {
      return FILES[tab.id].indexOf(path) !== -1;
    })[0];
  }

  function render(path) {
    if (rendered[path]) return rendered[path];
    var source = texts[path] || "";
    var lang = tabForFile(path).lang;
    var html;
    try {
      // highlight.js escapes the source. If the library did not load, escape it here.
      html = window.hljs
        ? window.hljs.highlight(source, { language: lang }).value
        : escapeHtml(source);
    } catch {
      html = escapeHtml(source);
    }
    rendered[path] = splitLines(html)
      .map(function (line, index) {
        return '<span class="line" data-n="' + (index + 1) + '">' + line + "</span>";
      })
      .join("");
    return rendered[path];
  }

  /* ---------- Finding where a skill lives ---------- */

  function indent(line) {
    return line.length - line.replace(/^\s+/, "").length;
  }

  /* A block runs from its first line to the first line indented no deeper,
     and includes that line when it only closes the block. */
  function blockEnd(lines, start) {
    var base = indent(lines[start]);
    var end;
    for (end = start + 1; end < lines.length; end++) {
      if (!lines[end].trim()) continue;
      var depth = indent(lines[end]);
      if (depth > base) continue;
      if (depth === base && /^\s*(\}|\)|\]|<\/)/.test(lines[end])) return end;
      break;
    }
    while (end > start + 1 && !lines[end - 1].trim()) end--;
    return end - 1;
  }

  /* Only list a skill if its code is really in the file it names. */
  function locate(tab) {
    return (SKILLS[tab] || [])
      .map(function (skill) {
        var text = texts[skill.file];
        if (typeof text !== "string") return null;
        var lines = text.split("\n");
        for (var i = 0; i < lines.length; i++) {
          if (lines[i].indexOf(skill.find) !== -1) {
            var end = skill.n ? i + skill.n - 1 : blockEnd(lines, i);
            return {
              skill: skill,
              file: skill.file,
              line: i + 1,
              last: Math.min(lines.length, i + 70, end + 1),
            };
          }
        }
        return null;
      })
      .filter(Boolean);
  }

  /* ---------- Drawing ---------- */

  function showNote(entry) {
    var note = $("skill-note");
    note.textContent = "";
    if (!entry) {
      note.textContent = "Pick a skill to jump to the code that uses it.";
      return;
    }
    var range =
      entry.last > entry.line ? "lines " + entry.line + " to " + entry.last : "line " + entry.line;
    note.appendChild(h("strong", { text: entry.skill.name }));
    note.appendChild(
      document.createTextNode(" " + entry.skill.desc + " (" + entry.file + ", " + range + ")"),
    );
  }

  function commonDir(paths) {
    var parts = paths.map(function (p) {
      return p.split("/").slice(0, -1);
    });
    var prefix = parts[0] || [];
    parts.forEach(function (list) {
      var i = 0;
      while (i < prefix.length && prefix[i] === list[i]) i++;
      prefix = prefix.slice(0, i);
    });
    return prefix.length ? prefix.join("/") + "/" : "";
  }

  function drawFiles(tab) {
    var list = $("files");
    list.textContent = "";
    var paths = FILES[tab];
    var trim = commonDir(paths);
    paths.forEach(function (path) {
      var relative = path.slice(trim.length);
      var slash = relative.lastIndexOf("/");
      var dir = slash === -1 ? "" : relative.slice(0, slash + 1);
      var lines = (texts[path] || "").split("\n").length;
      list.appendChild(
        h(
          "button",
          {
            type: "button",
            class: "file",
            "data-path": path,
            "aria-current": String(path === current.file),
            onclick: function () {
              selectFile(path);
            },
          },
          [
            dir ? h("span", { class: "file-dir", text: dir }) : null,
            h("span", {
              class: "file-name",
              text: slash === -1 ? relative : relative.slice(slash + 1),
            }),
            h("small", { text: String(lines) }),
          ],
        ),
      );
    });
  }

  function selectFile(path) {
    current.file = path;
    lastFile[current.tab] = path;
    document.querySelectorAll("#files .file").forEach(function (button) {
      button.setAttribute("aria-current", String(button.dataset.path === path));
    });
    var lines = (texts[path] || "").split("\n").length;
    $("pane-path").textContent = path;
    $("pane-meta").textContent = lines + " lines";
    $("code").innerHTML = render(path); // built from highlight.js output or escaped text, never raw source
    var box = $("codebox");
    box.scrollTop = 0;
    box.scrollLeft = 0;
    box.setAttribute("aria-label", "Source of " + path);
  }

  function selectTab(id, focus) {
    current.tab = id;
    TABS.forEach(function (tab) {
      var button = $("tab-" + tab.id);
      var on = tab.id === id;
      button.setAttribute("aria-selected", String(on));
      button.tabIndex = on ? 0 : -1;
      button.querySelector("small").textContent =
        FILES[tab.id].length + (FILES[tab.id].length === 1 ? " file" : " files");
    });
    $("explorer").setAttribute("aria-labelledby", "tab-" + id);
    if (focus) $("tab-" + id).focus();
    $("tab-note").textContent = tabOf(id).note;

    located[id] = located[id] || locate(id);
    var holder = $("skills");
    holder.textContent = "";
    chipById = {};
    var groups = new Map();
    located[id].forEach(function (entry) {
      if (!groups.has(entry.skill.group)) groups.set(entry.skill.group, []);
      groups.get(entry.skill.group).push(entry);
    });
    groups.forEach(function (entries, name) {
      var row = h("div", { class: "skill-row" });
      entries.forEach(function (entry) {
        var button = h(
          "button",
          {
            type: "button",
            class: "skill",
            "aria-pressed": "false",
            onclick: function () {
              jump(entry, button);
            },
          },
          [entry.skill.name, h("small", { text: entry.file.split("/").pop() + ":" + entry.line })],
        );
        if (entry.skill.id) chipById[entry.skill.id] = button;
        row.appendChild(button);
      });
      holder.appendChild(h("div", { class: "skill-group" }, [h("p", { text: name }), row]));
    });

    var first = located[id][0];
    var path = lastFile[id] || (first ? first.file : FILES[id][0]);
    drawFiles(id);
    selectFile(path);
    showNote(null);
  }

  function jump(entry, button) {
    if (entry.file !== current.file) selectFile(entry.file);
    var box = $("codebox");
    box.querySelectorAll(".hit").forEach(function (node) {
      node.classList.remove("hit");
    });
    var first = null;
    for (var n = entry.line; n <= entry.last; n++) {
      var node = box.querySelector('.line[data-n="' + n + '"]');
      if (node) {
        node.classList.add("hit");
        if (!first) first = node;
      }
    }
    document.querySelectorAll("#skills .skill").forEach(function (chip) {
      chip.setAttribute("aria-pressed", String(chip === button));
    });
    showNote(entry);
    if (first)
      box.scrollTo({
        top: Math.max(0, first.offsetTop - box.clientHeight / 3),
        behavior: reduceMotion.matches ? "auto" : "smooth",
      });
    $("explorer").scrollIntoView({ block: "nearest" });
  }

  /* ---------- Wiring ---------- */

  TABS.forEach(function (tab, index) {
    var button = $("tab-" + tab.id);
    button.addEventListener("click", function () {
      selectTab(tab.id);
    });
    button.addEventListener("keydown", function (event) {
      var target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: TABS.length - 1 }[
        event.key
      ];
      if (target === undefined) return;
      event.preventDefault();
      selectTab(TABS[(target + TABS.length) % TABS.length].id, true);
    });
  });
  $("copy-code").addEventListener("click", function (event) {
    window.SiteUtil.copyText(
      event.currentTarget,
      texts[current.file] || "",
      $("code"),
      "Copy file",
    );
  });

  /* Other parts of the page open the explorer on a named skill, for example "tsx:session". */
  function open(tab, id) {
    return loadSources().then(function () {
      selectTab(tab);
      if (chipById[id]) chipById[id].click();
    });
  }

  loadSources().then(function () {
    selectTab(current.tab);
  });
  window.SourceViewer = { open: open };
})();
