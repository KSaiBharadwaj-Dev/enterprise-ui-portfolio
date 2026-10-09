# Sai Kalyandurg: My Personal Site

This is my personal site. It opens with a short animated entrance that asks what you want to see first: my
profile and work, or my skills in UI development. From there you get a profile page built from my resume, a
projects page that connects to my GitHub, and a UI skills page with a live React and TypeScript demo and a
source explorer, so you can read the code behind whatever you just clicked.

It is plain HTML, CSS and JavaScript. No framework, and no build step for the site itself. I host it on Vercel.

## How I update it (no tools needed)

I edit a file, save it, and reload the page.

| To change | Edit |
| --- | --- |
| Email, LinkedIn, GitHub username, site repo, resume link, contact form key | `data/settings.js` |
| Summary, results, jobs, skills, certifications, education | `data/profile.js` |
| Projects, their GitHub repositories and file structure | `data/projects.js` |

### Connecting GitHub

1. In `data/settings.js` I set `github` to my GitHub username. The Projects page then shows a GitHub card with
   my public repository and follower counts, an "Open my GitHub profile" button, and my six most recently
   pushed repositories.
2. In `data/projects.js` I set `repo: "username/repository-name"` on each project. Each project then gets an
   "Open on GitHub" button, and "Browse file structure" loads the real tree from GitHub. Every file in the
   tree opens on GitHub.
3. Once a real repository is linked, I delete `placeholder: true` and the sample `structure` list.

Good to know: only public repositories are visible. GitHub allows 60 anonymous requests per hour per visitor,
so I cache answers for ten minutes. If GitHub cannot be reached, the saved `structure` list is shown instead.

### Contact form

The form sends through [Web3Forms](https://web3forms.com). I enter my email there, copy the access key they
send me, and paste it into `web3formsKey` in `data/settings.js`. Without a key, the form opens the visitor's
email app instead. A static site cannot send email by itself, so it needs a key (or my own server) to actually
deliver a message.

## Running it on my computer

I open `index.html` in a browser. To serve it like a real site, I need Node 20.19 or newer, then I run
`npm install`, `npm run serve`, and open http://localhost:8080.

## Putting it online

It runs on Vercel, deployed from my GitHub repository. The site is static and the compiled `js/lab.js` is
already in the repo, so there is nothing for Vercel to build: I leave the build command empty and serve the
folder root. I never upload `node_modules`. Any other static host would work the same way.

## Folder map

```
index.html            animated entrance
favicon.svg           the browser-tab icon
profile.html          profile, experience, skills, contact
projects.html         projects, GitHub card, file-structure browser
ui.html               live demo and source explorer
data/                 the files I edit: settings, profile, projects
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

## Changing the code

I only need Node when I edit `src/`.

```
npm install
npm run build          type-check (strict), bundle src/lab into js/lab.js, refresh the explorer snapshot
npm run check:angular  compile the Angular files with the strict Angular compiler
npm run format         Prettier for src, css, the pages and the hand-written scripts
```

After changing any file the explorer shows, I run `npm run build` so `js/source-snapshot.js` matches. The
snapshot is only used when the page is opened from disk. On a hosted site the explorer reads the live files.

To show a new file in the explorer, I add its path to `data/source-files.js`. To add a skill button, I add an
entry to `data/skills-map.js`. A button only appears when the text in `find` exists in that file.

## Security notes

- Every page carries a Content Security Policy in a meta tag, with no inline scripts or styles. Each page
  allows only what it uses: the profile page may call Web3Forms, the projects page may call GitHub, and the UI
  skills page may load React and highlight.js from cdnjs. If I add a service, I add its host to `connect-src`
  (or `script-src`) in the meta tag of the page that uses it.
- Text from the data files is written with `textContent`, never `innerHTML`.
- GitHub user and repository names are validated before they go into a request URL.
- External links use `rel="noopener noreferrer"`.
- I have not pinned the CDN scripts yet. To do it, add an `integrity` attribute with the hash cdnjs publishes
  for each file.

## About the demo

The server in the UI demo is simulated inside the page, so sign-in, permissions and failures behave like a real
API with no network calls. Demo accounts: `analyst` / `Analyst#2026` (viewer) and `lead` / `Lead#2026` (admin).
The Angular files are source only: they pass the strict Angular compiler, but I do not run them on the page.