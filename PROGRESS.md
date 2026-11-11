# Website improvements — progress

Tick `[x]` when done. **You** = a setting only you can change (GitHub, WhatsApp, Google Sheet); **Claude** = a code change.

> Keep this file off GitHub: the site is public, and this list describes weak spots.

Last reviewed: 3 Nov 2026 (two items added 11 Nov)

Hosting is planned to move from GitHub Pages to Vercel later. The two GitHub settings below then become Vercel's job instead (it handles "www" and HTTPS itself), but check both after the move.

## 1. Fix soon

- [ ] **You:** Fix the security warning on `https://www.communitybuildingagency.com` — GitHub repo → Settings → Pages → remove the custom domain and add it again, so the certificate covers "www" too (can take a while to appear).
- [ ] **You:** Tick "Enforce HTTPS" on the same page, so `http://` redirects to the secure version.
- [ ] **You:** The site is blocked on your mobile connection (seen 11 Nov via iPhone hotspot): the carrier's DNS filter, Whalebone, sends visitors to a warning page. Public DNS and the site itself are fine. Report it as a false positive from that warning page, and check https://transparencyreport.google.com/safe-browsing/search?url=communitybuildingagency.com
- [ ] **You:** Delete `apps-script.gs` from GitHub — it's publicly readable at `communitybuildingagency.com/apps-script.gs`. It stays in this project folder; just don't upload it to the host again.
- [ ] **You:** Turn on "Approve new members" in the WhatsApp group settings; check whether the Instagram chat has a similar option (both invite links are visible in the page code).
- [ ] **Claude:** Add spam protection to both forms (hidden bot-trap field + checks in `apps-script.gs`).
- [ ] **You:** Check the phone column in the Google Sheet for `#ERROR!` or missing `+` / leading `0`.
- [ ] **Claude:** Save every form answer as plain text, so Sheets never turns it into a formula or number.
- [ ] **Claude:** Show "Something went wrong, please email us" when a form fails to save, instead of always saying "Thank you".
- [ ] **You:** After the `apps-script.gs` changes, paste it into the Apps Script editor and redeploy (Manage deployments → edit → New version).

## 2. Tracking

- [x] **Claude:** Remove Google Analytics from all 5 pages.
- [x] **Claude:** Add `dnt=1` to the Vimeo video, so it sets no tracking cookies (then no cookie banner is needed).
- [ ] **Claude:** Track button clicks in Umami with separate names (Book – navbar / hero / services, Join form, Instagram, WhatsApp, form submitted).
- [ ] **You:** Use tracked links outside the site, e.g. `communitybuildingagency.com/?utm_source=instagram` in the Instagram bio.
- [ ] **Claude:** Name Umami, Vimeo and Google Fonts in the privacy policy (cookies section).

## 3. Navbar

- [ ] **Decide + Claude:** "About Us" — rename to "Home", or link it to the About Us section (`index.html#about-us`).
- [x] **Claude:** Give "Book Free Consultation" its own address (`#book`) that opens the form, so it can be shared as a link; same for the join form (`joincommunity.html#join`).
- [x] **Claude:** Make the navbar and footer one shared piece instead of 5 copies (`layout.js`).

## 4. Speed

- [x] **Claude:** Shrink the home page globe picture (`globe100.png`, 4.3 MB) — deleted instead; the CBA sphere logo is now the placeholder.
- [ ] **Claude:** Shrink the CBA sphere logo (`CBA_sphere.png`, 549 KB → ~60 KB). It's now both the navbar logo and the home page globe placeholder (shown up to 460px), so it has to stay sharp at that size.
- [x] **You:** Replace `3.png` (2.3 MB) with a resized `3.jpg` (606 KB).
- [ ] **Claude:** Shrink the background `home-grad-green.png` (2.3 MB) and the founder photo (740 KB).
- [ ] **Claude:** Load the Vimeo video only when scrolled to, and remove the unused Vimeo script.

## 5. Search and sharing

- [x] **Claude:** Add a description to the home page (shown under the link in Google).
- [x] **Claude:** Add link previews (image + title) for WhatsApp, Instagram and LinkedIn on all pages.
- [ ] **You:** Once live, check a preview: paste the site link into a WhatsApp chat with yourself, or use https://www.opengraph.xyz/ (apps can cache an old preview for a while).
- [x] **Claude:** Add a sitemap and `robots.txt`.
- [ ] **You:** Register the site in Google Search Console and submit the sitemap.
- [x] **Claude:** Add a custom 404 page (`404.html`).

## 6. Smaller things

- [ ] **Decide + Claude:** Add a "Which service?" question to the consultation form.
- [x] **Claude:** Logo read out twice by screen readers — fix its alt text.
- [x] **Claude:** Give the three home page photos meaningful descriptions (now "Community visual 1/2/3").
- [x] **Claude:** Keep keyboard focus inside an open form, and return it to the button when the form closes.

## After each batch

- [ ] **You:** Upload the changed files to GitHub.
