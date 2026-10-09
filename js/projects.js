/* Projects page: project cards, a browsable file tree for each repository, and the GitHub profile card. */
(function () {
  "use strict";
  var h = window.SiteUtil.h;
  var S = window.SITE;
  var GH = window.GH;
  var $ = function (id) {
    return document.getElementById(id);
  };
  var MAX_ENTRIES = 300;

  /* Links come from data files and from GitHub, so only web addresses are allowed.
     This keeps a javascript: or data: value out of an href. */
  function webUrl(value) {
    try {
      var url = new URL(String(value));
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch {
      return "";
    }
  }

  /* ---------- File tree ---------- */

  /* Turn a flat list of paths into nested folders and files. */
  function nest(paths) {
    var root = { dirs: {}, files: [] };
    paths.forEach(function (path) {
      var parts = path.split("/");
      var node = root;
      parts.slice(0, -1).forEach(function (part) {
        node.dirs[part] = node.dirs[part] || { dirs: {}, files: [] };
        node = node.dirs[part];
      });
      node.files.push(parts[parts.length - 1]);
    });
    return root;
  }

  function countFiles(node) {
    return Object.keys(node.dirs).reduce(function (sum, name) {
      return sum + countFiles(node.dirs[name]);
    }, node.files.length);
  }

  /* Folders first, then files, each in alphabetical order.
     `urlFor` returns a GitHub link, or "" when there is none. */
  function branch(node, prefix, depth, urlFor, openAll) {
    var list = h("ul", { class: "tree" });
    Object.keys(node.dirs)
      .sort()
      .forEach(function (name) {
        var path = prefix + name;
        var child = node.dirs[name];
        var summary = h("summary", {}, [
          h("span", { class: "tree-name", text: name + "/" }),
          h("span", { class: "tree-count", text: String(countFiles(child)) }),
        ]);
        var details = h("details", { open: openAll || (depth === 0 && name === "src") }, [
          summary,
          branch(child, path + "/", depth + 1, urlFor, openAll),
        ]);
        list.appendChild(h("li", { class: "tree-dir" }, [details]));
      });
    node.files.sort().forEach(function (name) {
      var url = urlFor(prefix + name);
      list.appendChild(
        h("li", { class: "tree-file" }, [
          url ? window.SiteUtil.external(name, url) : h("span", { text: name }),
        ]),
      );
    });
    return list;
  }

  function renderTree(paths, urlFor) {
    var shown = paths.slice(0, MAX_ENTRIES);
    var root = nest(shown);
    var wrap = h(
      "div",
      { class: "tree-box", role: "region", "aria-label": "Repository files", tabindex: "0" },
      [branch(root, "", 0, urlFor, shown.length <= 24)],
    );
    return { node: wrap, clipped: paths.length - shown.length };
  }

  /* ---------- Project cards ---------- */

  function projectCard(project) {
    var panel = h("div", { class: "project-files", hidden: true });
    var status = h("p", { class: "files-status", role: "status" });
    var holder = h("div", {});
    panel.appendChild(status);
    panel.appendChild(holder);

    var loaded = false;
    function show(paths, branchName, note, live) {
      holder.textContent = "";
      var urlFor =
        project.repo && live
          ? function (path) {
              return GH.link(project.repo, branchName, path);
            }
          : function () {
              return "";
            };
      var built = renderTree(paths, urlFor);
      holder.appendChild(built.node);
      var more =
        built.clipped > 0
          ? " Showing the first " + MAX_ENTRIES + " files; open the repository for the rest."
          : "";
      status.textContent = note + more;
    }
    function showSaved(reason) {
      var paths = project.structure || [];
      if (!paths.length) {
        holder.textContent = "";
        status.textContent = reason;
        return;
      }
      var note = project.repo
        ? reason + " Showing the saved structure."
        : "Example structure. The real files appear here once the repository is linked.";
      show(paths, "", note, false);
    }
    function load() {
      if (loaded) return;
      loaded = true;
      if (!project.repo) {
        showSaved("");
        return;
      }
      status.textContent = "Loading the file tree from GitHub...";
      GH.tree(project.repo)
        .then(function (result) {
          show(
            result.files,
            result.branch,
            "Live from GitHub: " +
              project.repo +
              ", branch " +
              result.branch +
              ", " +
              result.files.length +
              " files.",
            true,
          );
        })
        .catch(function (error) {
          showSaved(GH.explain(error));
        });
    }

    var toggle = h("button", {
      type: "button",
      class: "btn btn-sm",
      "aria-expanded": "false",
      onclick: function () {
        var open = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(open));
        toggle.textContent = open ? "Hide file structure" : "Browse file structure";
        panel.hidden = !open;
        if (open) load();
      },
      text: "Browse file structure",
    });

    var repoUrl = project.repo ? GH.link(project.repo) : "";
    var demoUrl = project.demo ? webUrl(project.demo) : "";
    var actions = h("div", { class: "project-actions" }, [
      repoUrl
        ? window.SiteUtil.external("Open on GitHub", repoUrl, "btn btn-sm btn-primary")
        : null,
      demoUrl ? window.SiteUtil.external("Live demo", demoUrl, "btn btn-sm") : null,
      toggle,
    ]);

    return h("li", { class: "project" }, [
      h("div", { class: "project-main" }, [
        h("h3", {}, [
          project.name,
          project.placeholder ? h("span", { class: "tag", text: "Placeholder" }) : null,
        ]),
        h("p", { class: "desc", text: project.summary || "" }),
        project.tags && project.tags.length
          ? h(
              "ul",
              { class: "project-tags", "aria-label": "Technologies" },
              project.tags.map(function (tag) {
                return h("li", { text: tag });
              }),
            )
          : null,
      ]),
      actions,
      panel,
    ]);
  }

  window.PROJECTS.forEach(function (project) {
    $("project-list").appendChild(projectCard(project));
  });

  /* ---------- GitHub profile and recent repositories ---------- */

  if (S.github) {
    var section = $("github");
    section.hidden = false;
    $("gh-handle").textContent = "@" + S.github;
    var openProfile = $("gh-open");
    openProfile.href = "https://github.com/" + encodeURIComponent(S.github);

    GH.profile(S.github)
      .then(function (user) {
        var parts = [user.public_repos + " public repositories", user.followers + " followers"];
        $("gh-stats").textContent = parts.join(" · ");
        if (user.bio) $("gh-bio").textContent = user.bio;
      })
      .catch(function () {
        $("gh-stats").textContent = "";
      });

    GH.repos(S.github)
      .then(function (list) {
        var known = {};
        window.PROJECTS.forEach(function (p) {
          if (p.repo) known[p.repo.toLowerCase()] = true;
        });
        var fresh = list.filter(function (r) {
          return !known[r.full_name.toLowerCase()];
        });
        if (!fresh.length) return;
        $("recent").hidden = false;
        fresh.forEach(function (repo) {
          $("recent-list").appendChild(
            projectCard({
              name: repo.name,
              summary: repo.description || "No description yet.",
              tags: repo.language ? [repo.language] : [],
              repo: repo.full_name,
              demo: repo.homepage || "",
            }),
          );
        });
      })
      .catch(function (error) {
        $("gh-note").textContent = GH.explain(error);
      });
  }
})();
