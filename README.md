# Sai Kalyandurg: personal site

A small multi-page site: an animated entrance, a profile page built from the resume, a projects page that
connects to GitHub, and a UI skills page with a live React and TypeScript demo and a source explorer.
Plain HTML, CSS and JavaScript. There is no framework and no build step for the site itself.

## Update your content (no tools needed)

Edit a file, save it, reload the page.

| To change | Edit |
| --- | --- |
| Email, LinkedIn, GitHub username, resume link, contact form key | `data/settings.js` |
| Summary, results, jobs, skills, certifications, education | `data/profile.js` |
| Projects, their GitHub repositories and file structure | `data/projects.js` |

### Connect GitHub

1. In `data/settings.js` set `github: "your-username"`. The Projects page then shows a GitHub card with your
   public repository and follower counts, an "Open my GitHub profile" button, and your six most recently
   pushed repositories.
2. In `data/projects.js` set `repo: "your-username/repository-name"` on each project. Each project then gets an
   "Open on GitHub" button, and "Browse file structure" loads the real tree from GitHub. Every file in the tree
   opens on GitHub.
3. Delete `placeholder: true` and the sample `structure` list once the real repository is linked.

Notes: only public repositories are visible. GitHub allows 60 anonymous requests per hour per visitor, so
answers are cached for ten minutes. If GitHub cannot be reached, the saved `structure` list is shown instead.

### Contact form

The form sends through [Web3Forms](https://web3forms.com). Enter your email there, copy the access key it sends
you, and paste it into `web3formsKey` in `data/settings.js`. Without a key the form opens the visitor's email app.
A site cannot send email by itself, so a key (or your own server) is required for delivery.

## See it on your computer

Open `index.html` in a browser. To serve it like a real site, install Node 20.19 or newer, then run
`npm install`, `npm run serve`, and open http://localhost:8080.

## Put it online

Any static host works. For GitHub Pages: create a repository, upload everything in this folder
(not `node_modules`), then Settings, Pages, deploy from the main branch. Netlify and Cloudflare Pages
accept the same folder.

## Folder map

```
index.html            animated entrance
favicon.svg           the browser-tab icon
profile.html          profile, experience, skills, contact
projects.html         projects, GitHub card, file-structure browser
ui.html               live demo and source explorer
data/                 the files you edit: settings, profile, projects
  source-files.js     which files the source explorer lists
  skills-map.js       which skill buttons point at which lines
css/                  one stylesheet per page, plus base.css and lab.css
js/                   plain JavaScript for each page
  lab.js              compiled from src/lab (do not edit by hand)
  source-snapshot.js  generated copy of the files the explorer shows
src/lab/              the React + TypeScript demo, split into modules
src/angular/          Angular equivalents (compiled to check them, not run on the page)
tools/                build.mjs and serve.mjs
```

## Change the code

You only need Node when you edit `src/`.

```
npm install
npm run build          type-check (strict), bundle src/lab into js/lab.js, refresh the explorer snapshot
npm run check:angular  compile the Angular files with the strict Angular compiler
npm run format         Prettier for src, css, the pages and the hand-written scripts
```

Run `npm run build` after changing any file the explorer shows, so `js/source-snapshot.js` matches. The snapshot
is only used when the page is opened from disk. On a hosted site the explorer reads the live files.

To show a new file in the explorer, add its path to `data/source-files.js`. To add a skill button, add an entry to
`data/skills-map.js`. A button only appears when the text in `find` exists in that file.

## Security notes

- Every page carries a Content Security Policy in a meta tag, with no inline scripts or styles. Each page allows
  only what it uses: the profile page may call Web3Forms, the projects page may call GitHub, and the UI skills
  page may load React and highlight.js from cdnjs. If you add a service, add its host to `connect-src` (or
  `script-src`) in the meta tag of the page that uses it.
- Text from the data files is written with `textContent`, never `innerHTML`.
- GitHub user and repository names are validated before they go into a request URL.
- External links use `rel="noopener noreferrer"`.
- To pin the CDN scripts, add an `integrity` attribute with the hash cdnjs publishes for each file.

## About the demo

The server in the UI demo is simulated inside the page, so sign-in, permissions and failures behave like a real API
with no network calls. Demo accounts: `analyst` / `Analyst#2026` (viewer) and `lead` / `Lead#2026` (admin).
The Angular files are source only: they pass the strict Angular compiler but are not run on the page.
