# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing site for Community Building Agency (CBA), hosted on GitHub Pages at communitybuildingagency.com (domain via Namecheap; `www` CNAMEs to `likakurbanovaite.github.io`). Plain HTML/CSS/JS — no build step, no package manager, no tests, no linter. The folder is not a git repository locally.

## Running locally

```
python3 -m http.server        # then http://localhost:8000
```

Opening files directly (`file://`) mostly works, but the hero globe (`globe.js`, on `index.html`) needs a server (ES module + CDN import map + texture loading); without one it just shows the static fallback image. Stop it with Ctrl+C, or `lsof -ti :8000 | xargs kill`.

## Structure

- Pages: `index.html` (home), `services.html`, `joincommunity.html`, `privacypolicy.html`, `communityguidelines.html`. They stay in the root (the host serves `index.html` from there, and moving pages would change their URLs). Plus `404.html`, which GitHub Pages and Vercel both show for any missing address: because that can be a nested path like `/services/old-page`, it has `<base href="/">` so its relative paths (and the ones layout.js and main.js add) resolve from the root. The local `python3 -m http.server` doesn't use it — open `/404.html` directly to preview.
- `style.css` — the one stylesheet for every page.
- Scripts live in `src/js/`. Paths inside them (images, page links, the globe texture) are relative to the page, not the script, so they're written as from the root, e.g. `assets/...`.
- `src/js/layout.js` — the shared notice banner, navbar and footer (see below).
- `src/js/main.js` — shared behaviour loaded by every page.
- `src/js/globe.js` — Three.js (via import map from jsDelivr) interactive globe in the home hero, wrapping the 2:1 `assets/globe/photogrid_globe_thinnerlines.jpg` (the 14 MB PNG original was deleted; a replacement texture should also be an opaque JPG of around 1.5 MB, not a PNG). `assets/cba/CBA_sphere.png` (the logo) doubles as the static placeholder shown until WebGL is ready, drawn at 91.5% of the box so it matches the rendered sphere (the maths is in a comment in `style.css`; recalculate if the camera in `globe.js` changes). Its CSS (`.globe-3d`) is in `style.css`.
- `apps-script.gs` — Google Apps Script backend for the forms. It is **not** deployed from here: after editing, the user must paste it into the Apps Script editor and redeploy via Deploy → Manage deployments → edit → New version (never a new deployment, which changes the URL in `src/js/main.js`). Always remind them. It is not part of the website: it shouldn't be uploaded to the host, where it would be publicly readable.

## Things that span multiple files

**Shared chrome lives in `layout.js`.** The dev banner (`.dev-banner`, with a "Last update" date — currently hidden site-wide by two rules in `style.css`), navbar and footer are template strings in `layout.js`, not in the pages. Every page loads it with a plain, non-deferred `<script src="src/js/layout.js"></script>` straight after `<body>`, so the navbar is inserted before first paint; the footer is inserted after `<main>` on DOMContentLoaded. `aria-current` is set from the URL. A new page needs that script tag and a `<main>` element. Footer order: copyright · CBA Community Guidelines & Terms of Participation · Privacy Policy. Without JavaScript there is no navbar or footer.

**Search and link-preview tags are per page.** Each page's `<head>` has its own `<meta name="description">` plus a block of `canonical` / Open Graph / `twitter:card` tags (title and description copied from the page's `<title>` and description). Link-preview crawlers don't run JavaScript, so these can't move into `layout.js`. All use absolute URLs on `https://communitybuildingagency.com/` and share one image, `assets/cba/CBA_share.jpg` (1200×630). A new page needs its own block and an entry in `sitemap.xml`; changing the domain means updating every block, `sitemap.xml` and `robots.txt`.

**Two forms, one endpoint.**
- *Consultation form* — its modal markup is injected by `main.js` (template string) so it isn't duplicated per page; any `.book-btn` element opens it (navbar CTA, hero, services). Includes an "Other" radio that reveals a required text field (`syncHeardOther`), and a confirmation panel that replaces the form on success and resets when the modal closes.
- *Join Community form* — markup lives in `joincommunity.html` (`#joinModal`), opened by `.join-btn`, wired with `setupModal`. Its scrollable `.agreement-box` contains the Community Guidelines text, which is duplicated in `communityguidelines.html` — keep the two in sync (the user asked not to change the form itself when creating the page).
- Both post `FormData` via `wireForm()` to `GOOGLE_APPS_SCRIPT_URL` (no-cors, so the response can't be read). A hidden `formType` field (`consultation` / `join-community`) routes the row to a sheet tab in `apps-script.gs` (`TABS` config: tab name + ordered field list = column headers, written only when the tab is empty). Field `name` attributes in the HTML must match the `fields` arrays. If the field list for an existing tab changes, use a new tab name so old columns don't misalign.
- The script then emails the owner (`notifyOwner`) and the submitter (`sendConsultationEmail` / `sendWelcome`, plain text + HTML).

**Backgrounds.** `body::before` paints the fixed `assets/home/home-grad-green.png` (dark green) site-wide; only `.hero`, `#who-we-help` and `#process` on the home page let it show through, so text directly on those sections is flipped to white in CSS. Subpages use `body.page-white` to opt out.

## CSS conventions

- Design tokens live in `:root` (`--ink`, `--muted`, `--coral` — actually fern green, `--line`, gradients, `--header-h`, `--banner-h`, `--logo-mark`). `main.js` keeps `--banner-h` in sync with the banner's real height.
- Breakpoints: `940px` (single-column hero, burger nav), `760px` (Who We Help spheres switch to two columns), `640px` (phones). Responsive rules are grouped near the end of the file, except the Who We Help block, which keeps its own media query.
- "Who We Help" spheres are absolutely positioned on a computed hexagonal grid (percent coordinates per `nth-child`); labels use `<br>` and `flex-direction: column`.
- Comments explain *why* (layout math, browser quirks); keep that style when adding non-obvious rules.
- Transparent PNGs (globe) get `filter: drop-shadow`, not `box-shadow`.

## Content

British English (organisation, enquiry). The founder/data controller is Lika Kurbanovaite; contact email communitybuildingagency@gmail.com. Large images in `assets/` (several 3–5 MB) are a known load-time issue.
