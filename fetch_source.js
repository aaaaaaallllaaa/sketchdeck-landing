// Pulls a fresh copy of the live sketchdeck.ai landing page and its assets. Run this, then
// build.js, whenever the real site changes and this mirror needs to be refreshed.
const fs = require('fs');
const path = require('path');

const SITE = 'https://sketchdeck.ai/';

async function main() {
  fs.mkdirSync('assets/images', { recursive: true });
  fs.mkdirSync('assets/css', { recursive: true });
  fs.mkdirSync('assets/js', { recursive: true });

  const htmlRes = await fetch(SITE, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await htmlRes.text();
  fs.writeFileSync('raw_page.html', html);
  console.log('Fetched raw_page.html:', html.length, 'bytes');

  const cssLinks = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)]
    .map(m => m[1]).map(u => u.startsWith('//') ? 'https:' + u : u).map(u => u.replace(/&#038;/g, '&'));

  for (const url of cssLinks) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    let name = url.split('/').pop().split('?')[0].split('#')[0] || 'style.css';
    if (url.includes('fonts.googleapis.com')) name = 'google-fonts.css';
    fs.writeFileSync('assets/css/' + name.replace(/[^a-zA-Z0-9._-]/g, '_'), text);
    console.log('CSS:', name);
  }

  const urls = new Set();
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/g)) urls.add(m[1]);
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/g)) {
    for (const part of m[1].split(',')) { const u = part.trim().split(/\s+/)[0]; if (u) urls.add(u); }
  }
  for (const m of html.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) urls.add(m[1]);
  for (const m of html.matchAll(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/gi)) urls.add(m[1]);
  for (const m of html.matchAll(/<meta[^>]+(?:property=["']og:image["']|name=["']msapplication-TileImage["'])[^>]+content=["']([^"']+)["']/gi)) urls.add(m[1]);
  for (const f of fs.readdirSync('assets/css')) {
    const css = fs.readFileSync('assets/css/' + f, 'utf8');
    for (const m of css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) urls.add(m[1]);
  }

  const list = [...urls].filter(u => !u.startsWith('data:'))
    .map(u => u.startsWith('//') ? 'https:' + u : u)
    .map(u => u.startsWith('/') && !u.startsWith('//') ? 'https://sketchdeck.ai' + u : u)
    .filter(u => u.startsWith('http'));

  const map = {};
  const usedNames = new Set();
  for (const url of [...new Set(list)]) {
    let name;
    try { name = decodeURIComponent(path.basename(new URL(url).pathname)) || 'asset'; }
    catch { name = 'asset_' + Math.random().toString(36).slice(2); }
    name = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    let final = name, i = 1;
    while (usedNames.has(final)) {
      const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
      const base = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
      final = base + '_' + (++i) + ext;
    }
    usedNames.add(final);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) { console.log('FAIL', res.status, url); continue; }
      fs.writeFileSync('assets/images/' + final, Buffer.from(await res.arrayBuffer()));
      map[url] = 'assets/images/' + final;
    } catch (e) { console.log('ERR', url, e.message); }
  }
  fs.writeFileSync('asset_map.json', JSON.stringify(map, null, 2));
  console.log('Downloaded', Object.keys(map).length, 'assets.');

  for (const [url, name] of [
    ['https://sketchdeck.ai/wp-includes/js/jquery/jquery.min.js?ver=3.7.1', 'jquery.min.js'],
    ['https://sketchdeck.ai/wp-content/plugins/oxygen/component-framework/vendor/aos/aos.js?ver=1', 'aos.js'],
  ]) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    fs.writeFileSync('assets/js/' + name, await res.text());
  }
  console.log('Done. Now run: node build.js');
}

main().catch(e => { console.error(e); process.exit(1); });
