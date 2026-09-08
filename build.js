// Rewrites the raw fetched sketchdeck.ai HTML into a self-contained static page:
// - all CSS/image/font/script references point to local files (already downloaded)
// - third-party tracking/analytics scripts are stripped (LinkedIn Insight, Clarity, Dreamdata,
//   RB2B, HubSpot, Google Tag Manager/Ads, GoDaddy site-traffic, TrustedSite, CallRail) since a
//   static mirror shouldn't send visits to SketchDeck's real, live analytics/ad accounts
// - WordPress/plugin JS with no client-only purpose (Complianz cookie banner backend calls,
//   HubSpot lead forms) is stripped since it depends on a WordPress backend this static copy
//   doesn't have
// - real page-interaction scripts (menu dropdowns, logo hover cards, infinite logo slider,
//   sticky header, animated counters, AOS scroll animations) are kept as-is
const fs = require('fs');

let html = fs.readFileSync('raw_page.html', 'utf8');
const assetMap = JSON.parse(fs.readFileSync('asset_map.json', 'utf8'));

// --- 1. Rewrite every known asset URL (images, srcset entries, css url() refs) to local paths ---
for (const [original, local] of Object.entries(assetMap)) {
  html = html.split(original).join(local);
}

// --- 2. Rewrite the <link rel=stylesheet> hrefs to local css files ---
const cssRewrites = [
  [/https?:\/\/fonts\.googleapis\.com\/css\?family=[^"']+/g, 'assets/css/google-fonts.css'],
  [/https?:\/\/sketchdeck\.ai\/wp-content\/plugins\/oxygen\/component-framework\/oxygen\.css\?ver=[\d.]+/g, 'assets/css/oxygen.css'],
  [/https?:\/\/sketchdeck\.ai\/wp-content\/uploads\/useanyfont\/uaf\.css\?ver=\d+/g, 'assets/css/uaf.css'],
  [/https?:\/\/sketchdeck\.ai\/wp-content\/plugins\/complianz-gdpr\/assets\/css\/cookieblocker\.min\.css\?ver=\d+/g, 'assets/css/cookieblocker.min.css'],
  [/https?:\/\/sketchdeck\.ai\/wp-includes\/css\/dist\/components\/style\.min\.css\?ver=[\d.]+/g, 'assets/css/style.min.css'],
  [/https?:\/\/sketchdeck\.ai\/wp-content\/mu-plugins\/vendor\/wpex\/godaddy-launch\/includes\/Dependencies\/GoDaddy\/Styles\/build\/latest\.css\?ver=[\d.]+/g, 'assets/css/latest.css'],
  [/https?:\/\/sketchdeck\.ai\/wp-content\/uploads\/complianz\/css\/banner-1-optout\.css\?ver=\d+/g, 'assets/css/banner-1-optout.css'],
  [/\/\/sketchdeck\.ai\/wp-content\/uploads\/oxygen\/css\/609\.css\?cache=\d+&#038;ver=[\d.]+/g, 'assets/css/609.css'],
  [/\/\/sketchdeck\.ai\/wp-content\/uploads\/oxygen\/css\/131\.css\?cache=\d+&#038;ver=[\d.]+/g, 'assets/css/131.css'],
  [/\/\/sketchdeck\.ai\/wp-content\/uploads\/oxygen\/css\/8\.css\?cache=\d+&#038;ver=[\d.]+/g, 'assets/css/8.css'],
  [/\/\/sketchdeck\.ai\/wp-content\/uploads\/oxygen\/css\/6\.css\?cache=\d+&#038;ver=[\d.]+/g, 'assets/css/6.css'],
  [/\/\/sketchdeck\.ai\/wp-content\/uploads\/oxygen\/css\/universal\.css\?cache=\d+&#038;ver=[\d.]+/g, 'assets/css/universal.css'],
  [/https?:\/\/sketchdeck\.ai\/wp-content\/plugins\/oxygen\/component-framework\/vendor\/aos\/aos\.css\?ver=[\d.]+/g, 'assets/css/aos.css'],
];
for (const [pattern, replacement] of cssRewrites) html = html.replace(pattern, replacement);

// --- 3. Rewrite kept script srcs to local paths ---
html = html.replace(/https?:\/\/sketchdeck\.ai\/wp-includes\/js\/jquery\/jquery\.min\.js\?ver=[\d.]+/g, 'assets/js/jquery.min.js');
html = html.replace(/https?:\/\/sketchdeck\.ai\/wp-content\/plugins\/oxygen\/component-framework\/vendor\/aos\/aos\.js\?ver=\d+/g, 'assets/js/aos.js');

// --- 4. Strip third-party tracking / backend-dependent <script> tags (by src substring) ---
const stripSrcSubstrings = [
  'hs-scripts.com', 'hs-analytics.net', 'hsadspixel.net', 'hs-banner.com', 'hscollectedforms.net',
  'trustedsite.com', 'callrail.com', 'img1.wsimg.com', 'complianz.min.js',
  'snap.licdn.com', 'clarity.ms', 'dreamdata.cloud', 'b2bjsstore', 'googletagmanager.com',
  'ywxi.net', 'getswan.com',
];
html = html.replace(/<script\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/g, (full, src) => {
  return stripSrcSubstrings.some(s => src.includes(s)) ? '' : full;
});

// --- 5. Strip specific inline tracking scripts by content signature ---
const stripInlineSignatures = [
  '_hsq.push', "w[l]=w[l]||[]", 'leadin_wordpress', 'var complianz', '_trfq', '_trfd',
  'speculationrules',
];
html = html.replace(/<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/g, (full, attrs, body) => {
  if (attrs.includes('application/ld+json')) return full; // keep structured data
  if (attrs.includes('speculationrules')) return '';
  return stripInlineSignatures.some(sig => body.includes(sig)) ? '' : full;
});

// --- 6. Remove noscript tracking pixels (HubSpot/GTM iframes) ---
html = html.replace(/<noscript>[\s\S]*?(googletagmanager|hs-analytics|hsforms)[\s\S]*?<\/noscript>/g, '');

// --- 7. Add a small banner comment at the top marking this as a static internal mirror ---
html = html.replace(
  '<head>',
  `<head>\n<!-- Static mirror of sketchdeck.ai's landing page for internal staging use. Generated ${new Date().toISOString().slice(0,10)}. Forms will not submit anywhere (no backend); this is a visual/structural copy only. -->`
);

fs.writeFileSync('index.html', html);
console.log('Wrote index.html:', html.length, 'bytes');

// --- 8. Rewrite url() references INSIDE the downloaded CSS files too (build step above only
// touched index.html — a couple of CSS files, e.g. uaf.css's @font-face src and one
// background-image in universal.css, still pointed at the live sketchdeck.ai domain). ---
const path = require('path');
for (const cssFile of fs.readdirSync('assets/css')) {
  const cssPath = path.join('assets/css', cssFile);
  let css = fs.readFileSync(cssPath, 'utf8');
  const before = css;
  css = css.replace(/url\((['"]?)(https?:\/\/sketchdeck\.ai[^'")]+|\/wp-content[^'")]+)\1\)/g, (full, quote, url) => {
    const cleanUrl = url.split('?')[0];
    let base = decodeURIComponent(path.basename(cleanUrl)).replace(/[^a-zA-Z0-9._-]/g, '_');
    const localPath = path.join('assets/images', base);
    if (fs.existsSync(localPath)) return `url(${quote}../images/${base}${quote})`;
    console.log('  [css] no local copy found for', url, '(left as-is)');
    return full;
  });
  if (css !== before) {
    fs.writeFileSync(cssPath, css);
    console.log('Rewrote asset URLs inside', cssFile);
  }
}

// --- Report any leftover references to the live domain that weren't rewritten, so nothing
// silently still points back to production. ---
const leftover = [...html.matchAll(/https?:\/\/sketchdeck\.ai[^"')\s]*/g)].map(m => m[0]);
const uniqueLeftover = [...new Set(leftover)];
console.log('\nRemaining sketchdeck.ai references (' + uniqueLeftover.length + '):');
uniqueLeftover.slice(0, 40).forEach(u => console.log(' ', u));
