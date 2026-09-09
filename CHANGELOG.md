# Changelog

Tracks every change made to this mirror, so individual changes can be reviewed and ported over to
the real sketchdeck.ai (WordPress) site one at a time rather than as one big diff.

## 2026-09-08

- **Initial mirror.** Pulled the live sketchdeck.ai landing page (HTML, CSS, images, fonts) and
  rebuilt it as a self-contained static copy. Stripped third-party tracking scripts (LinkedIn
  Insight, Microsoft Clarity, Dreamdata, RB2B, HubSpot, Google Tag Manager, GoDaddy site-traffic,
  TrustedSite, CallRail). Kept real page-interaction scripts (menu dropdowns, logo hover cards,
  infinite logo slider, sticky header, animated counters, AOS scroll animations).
- **Bug fix (found on the real site too, not introduced here):** the sticky-header script had a
  duplicated, unclosed function block causing a JS syntax error that silently broke the
  desktop/mobile header hide-on-scroll behavior. Removed the broken duplicate. **This same bug
  exists on the live sketchdeck.ai right now** — worth fixing there independently of this mirror.
- **Fixed relative nav links.** About, Careers, Contact, Product, Blog, and Demo links now point
  to the real `sketchdeck.ai` pages (absolute URLs) instead of relative paths, which would have
  404'd on this domain since those pages don't exist here. Only the logo's link back to `/` stays
  relative, since it should point at this page itself.
