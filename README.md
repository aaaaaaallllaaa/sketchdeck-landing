# SketchDeck Landing Page — Static Mirror

A self-contained static copy of sketchdeck.ai's landing page (`/`), for internal staging /
redesign-testing use. All images, fonts, and CSS are downloaded locally — nothing on this page
loads from sketchdeck.ai's own servers.

## What this is NOT

- **Not a full site clone.** Only the landing page (`/`) was mirrored, per what was asked for.
  Nav links to other pages (Product, About, Careers, Blog, Customer Stories, Contact) point back
  to the live sketchdeck.ai, since those pages weren't recreated here.
- **Not functional for forms or WordPress features.** This is HTML/CSS/JS only — no WordPress
  backend, no database. Any lead-capture forms on the page will not submit anywhere. The cookie
  consent banner's visual styling is here, but its backend (Complianz) isn't, so it won't
  actually record consent choices.
- **Not sending analytics anywhere.** Every third-party tracking script from the live site was
  stripped: LinkedIn Insight, Microsoft Clarity, Dreamdata, RB2B, HubSpot (tracking + lead forms),
  Google Tag Manager/Ads, GoDaddy site-traffic scripts, TrustedSite, CallRail. Real page-behavior
  scripts were kept: the dropdown menu, the logo hover cards, the infinite logo slider, the sticky
  header, the animated stat counters, and AOS scroll animations.

## Files

- `index.html` — the page.
- `assets/css/` — every stylesheet the page uses, downloaded as-is.
- `assets/images/` — every image/icon/logo the page references (~5.6MB, 129 files).
- `assets/js/` — jQuery and AOS (the two scripts the kept interactive features depend on).
- `fetch_source.js` — re-fetches the live page and all its assets fresh.
- `build.js` — rewrites a freshly-fetched page into this self-contained form (rewrites asset URLs
  to local paths, strips tracking scripts).

## Refreshing this mirror later

If the real sketchdeck.ai landing page changes and this copy needs to catch up:

```bash
node fetch_source.js   # re-downloads the live page + all assets
node build.js          # rewrites it into this self-contained form
```

`build.js` will print any leftover `sketchdeck.ai` references it didn't rewrite, so you can check
nothing was missed.
