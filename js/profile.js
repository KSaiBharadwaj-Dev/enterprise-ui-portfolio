/* Profile page: renders everything from data/profile.js and runs the contact form. */
(function () {
  "use strict";
  var h = window.SiteUtil.h;
  var P = window.PROFILE;
  var S = window.SITE;
  var $ = function (id) {
    return document.getElementById(id);
  };

  /* ---------- Content from data/profile.js ---------- */

  $("lead").textContent = P.lead;
  $("summary-text").textContent = P.summary;

  P.facts.forEach(function (fact) {
    $("facts").appendChild(
      h("div", {}, [
        h("dt", { text: fact.label }),
        h("dd", {}, [fact.value, fact.note ? h("small", { text: fact.note }) : null]),
      ]),
    );
  });

  P.results.forEach(function (item) {
    $("results").appendChild(
      h("li", { class: "result" }, [
        h("strong", { class: "num", text: item.value }),
        h("span", { text: item.label }),
      ]),
    );
  });

  P.experience.forEach(function (job) {
    var visible = job.bullets.slice(0, job.visible);
    var rest = job.bullets.slice(job.visible);
    var article = h("article", { class: "role" }, [
      h("div", { class: "role-head" }, [
        h("h3", { text: job.company }),
        h("p", { class: "when", text: job.start + " to " + job.end }),
      ]),
      h("p", { class: "where", text: job.role + ", " + job.location }),
      h(
        "ul",
        { class: "bullets" },
        visible.map(function (text) {
          return h("li", { text: text });
        }),
      ),
    ]);
    if (rest.length) {
      article.appendChild(
        h("details", { class: "more" }, [
          h("summary", {}, [
            h("span", {
              class: "when-closed",
              text: "Show " + rest.length + " more responsibilities",
            }),
            h("span", { class: "when-open", text: "Show fewer" }),
          ]),
          h(
            "ul",
            { class: "bullets" },
            rest.map(function (text) {
              return h("li", { text: text });
            }),
          ),
        ]),
      );
    }
    article.appendChild(
      h("p", { class: "stack" }, [h("strong", { text: "Environment: " }), job.environment]),
    );
    $("experience-list").appendChild(article);
  });

  P.skills.forEach(function (group) {
    $("skills-list").appendChild(
      h("div", {}, [
        h("dt", { text: group.group }),
        h("dd", {}, [
          h(
            "ul",
            { class: "chips" },
            group.items.map(function (item) {
              return h("li", { text: item });
            }),
          ),
        ]),
      ]),
    );
  });

  P.certifications.forEach(function (cert) {
    $("cert-list").appendChild(
      h("li", {}, [h("strong", { text: cert.name }), h("span", { text: cert.issuer })]),
    );
  });
  P.education.forEach(function (edu) {
    $("edu-list").appendChild(
      h("li", {}, [
        h("strong", { text: edu.school }),
        h("span", { text: edu.degree + " | " + edu.detail }),
        h("span", { text: edu.date + ", " + edu.location }),
      ]),
    );
  });

  /* ---------- Contact details ---------- */

  var emailLink = $("c-email");
  emailLink.textContent = S.email;
  emailLink.href = "mailto:" + S.email;
  var copyButton = $("copy-email");
  copyButton.addEventListener("click", function () {
    window.SiteUtil.copyText(copyButton, S.email, emailLink, "Copy");
  });

  /* ---------- Contact form ---------- */

  var form = $("contact-form");
  var status = $("f-status");
  var send = $("f-send");
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function say(message, kind) {
    status.textContent = message;
    status.className = "status " + (kind || "");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = $("f-name").value.trim();
    var email = $("f-email").value.trim();
    var message = $("f-message").value.trim();

    if (!name || !email || !message) {
      say("Fill in your name, email and a message.", "err");
      (!name ? $("f-name") : !email ? $("f-email") : $("f-message")).focus();
      return;
    }
    if (!EMAIL.test(email)) {
      say("Enter a valid email address so I can reply.", "err");
      $("f-email").focus();
      return;
    }
    if ($("f-botcheck").value) {
      // A person never sees this field. Pretend it worked and send nothing.
      say("Message sent.", "ok");
      form.reset();
      return;
    }

    if (S.web3formsKey) {
      send.disabled = true;
      say("Sending...", "info");
      var controller = new AbortController();
      var timer = window.setTimeout(function () {
        controller.abort();
      }, 15000);
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: S.web3formsKey,
          subject: "Website message from " + name,
          from_name: name,
          name: name,
          email: email,
          message: message,
          botcheck: "",
        }),
      })
        .then(function (response) {
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (json) {
              return { ok: response.ok && json.success !== false, json: json };
            });
        })
        .then(function (result) {
          if (!result.ok) throw new Error((result.json && result.json.message) || "Request failed");
          say("Message sent. I will reply to " + email + ".", "ok");
          form.reset();
        })
        .catch(function () {
          say("The message did not send. Email " + S.email + " directly.", "err");
        })
        .then(function () {
          window.clearTimeout(timer);
          send.disabled = false;
        });
    } else {
      var subject = "Website message from " + name;
      var body = message + "\n\n" + name + "\n" + email;
      say("Opening your email app. If nothing opens, write to " + S.email + ".", "info");
      window.location.href =
        "mailto:" +
        S.email +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
    }
  });
})();
