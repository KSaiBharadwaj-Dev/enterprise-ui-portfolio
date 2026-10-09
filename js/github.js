/* A small GitHub client for public data. It needs no key. Visitors share GitHub's anonymous rate limit,
   so every answer is kept for ten minutes in sessionStorage. Names are validated before they go into a URL. */
(function () {
  "use strict";
  var API = "https://api.github.com";
  var TTL_MS = 10 * 60 * 1000;
  var USER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
  // "." and ".." are not valid repository names, and they would change the request path.
  var REPO = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/(?!\.{1,2}$)[A-Za-z0-9._-]{1,100}$/;

  function remembered(key) {
    try {
      var raw = window.sessionStorage.getItem(key);
      var entry = raw ? JSON.parse(raw) : null;
      return entry && Date.now() - entry.at < TTL_MS ? entry.data : null;
    } catch {
      return null;
    }
  }
  function remember(key, data) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data: data }));
    } catch {
      /* Storage can be blocked or full. The page works without it. */
    }
  }

  function request(path) {
    var key = "gh:" + path;
    var hit = remembered(key);
    if (hit) return Promise.resolve(hit);
    var controller = new AbortController();
    var timer = window.setTimeout(function () {
      controller.abort();
    }, 8000);
    return fetch(API + path, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then(function (response) {
        if (!response.ok) {
          var error = new Error("GitHub answered " + response.status);
          error.status = response.status;
          throw error;
        }
        return response.json();
      })
      .then(function (data) {
        remember(key, data);
        return data;
      })
      .finally(function () {
        window.clearTimeout(timer);
      });
  }

  /* A rejected name is a mistake in the data files, so the message points the owner there. */
  function invalid(message) {
    var error = new Error(message);
    error.invalid = true;
    return Promise.reject(error);
  }

  /* A short sentence a visitor can act on. */
  function explain(error) {
    if (error && error.invalid)
      return "The GitHub name in the site's data files looks wrong. Check it for typos.";
    if (error && error.status === 409) return "That repository is empty.";
    if (error && (error.status === 403 || error.status === 429))
      return "GitHub's limit for anonymous visitors was reached. Try again in a few minutes.";
    if (error && error.status === 404) return "GitHub could not find that repository.";
    if (error && error.name === "AbortError") return "GitHub took too long to answer.";
    return "GitHub could not be reached from this page.";
  }

  function enc(path) {
    return path.split("/").map(encodeURIComponent).join("/");
  }

  function profile(user) {
    if (!USER.test(user)) return invalid("Invalid GitHub username");
    return request("/users/" + encodeURIComponent(user));
  }

  function repos(user) {
    if (!USER.test(user)) return invalid("Invalid GitHub username");
    return request(
      "/users/" + encodeURIComponent(user) + "/repos?sort=pushed&per_page=30&type=owner",
    ).then(function (list) {
      return list
        .filter(function (r) {
          return !r.fork && !r.archived;
        })
        .slice(0, 6);
    });
  }

  /* The files of a repository: look up the default branch, then read its whole tree in one request. */
  function tree(fullName) {
    if (!REPO.test(fullName)) return invalid("Invalid repository name");
    return request("/repos/" + enc(fullName)).then(function (info) {
      return request(
        "/repos/" +
          enc(fullName) +
          "/git/trees/" +
          encodeURIComponent(info.default_branch) +
          "?recursive=1",
      ).then(function (result) {
        return {
          branch: info.default_branch,
          truncated: Boolean(result.truncated),
          files: result.tree
            .filter(function (item) {
              return item.type === "blob";
            })
            .map(function (item) {
              return item.path;
            }),
        };
      });
    });
  }

  /* A github.com address for a repository, or for one file in it. Returns "" for an invalid name. */
  function link(fullName, branch, path) {
    if (!REPO.test(fullName)) return "";
    var base = "https://github.com/" + fullName;
    if (!path) return base;
    return base + "/blob/" + encodeURIComponent(branch || "HEAD") + "/" + enc(path);
  }

  window.GH = { profile: profile, repos: repos, tree: tree, link: link, explain: explain };
})();
