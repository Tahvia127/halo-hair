/* Halo Hair Studio — static build. Reads data/, writes index.html. No dependencies. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const site = JSON.parse(readFileSync('data/site.json','utf8'));
const svc  = JSON.parse(readFileSync('data/services.json','utf8'));
const shop = JSON.parse(readFileSync('data/shop.json','utf8'));

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const money = n => '$' + Number(n).toFixed(Number(n)%1 ? 2 : 0);
const telRaw = site.phone.replace(/[^\d+]/g,'');
const fmtMins = m => { const h = Math.floor(m/60), r = m%60;
  return h ? `${h} hr${h>1?'s':''}${r?` ${r} min`:''}` : `${r} min`; };

/* ---------- validate: fail the build rather than ship a broken page ---------- */
const errors = [];
const img = n => { if (!existsSync(`assets/img/${n}.webp`)) errors.push(`missing image assets/img/${n}.webp`); return n; };
const shadeCodes = new Set(shop.shades.map(s => s.code));
const catSlugs = new Set(shop.categories.map(c => c.slug));
svc.services.forEach(s => { img(s.image);
  if (!s.menu?.length) errors.push(`service ${s.slug} has no menu items`);
  s.menu.forEach(m => { if (!(m.mins > 0) || !(m.price > 0)) errors.push(`service ${s.slug}: "${m.name}" needs mins and price`); }); });
shop.categories.forEach(c => img(c.image));
shop.products.forEach(p => { img(p.image);
  if (!catSlugs.has(p.cat)) errors.push(`product ${p.id}: unknown category "${p.cat}"`);
  p.shades.forEach(c => { if (!shadeCodes.has(c)) errors.push(`product ${p.id}: unknown shade "${c}"`); });
  if (!p.options?.length) errors.push(`product ${p.id} has no options`); });
shop.shades.forEach(s => { if (s.tone?.length !== 3) errors.push(`shade ${s.code} needs three tones`); });
const days = site.schedule.days;
for (let d = 0; d < 7; d++) { const v = days[d];
  if (v !== null && !(Array.isArray(v) && /^\d\d:\d\d$/.test(v[0]) && /^\d\d:\d\d$/.test(v[1]) && v[0] < v[1]))
    errors.push(`schedule day ${d} must be null or ["HH:MM","HH:MM"]`); }
if (errors.length) { console.error('  build failed:\n  - ' + errors.join('\n  - ')); process.exit(1); }

/* ---------- services: stacked accordion rows ---------- */
const SERVICE_ROWS = svc.services.map((s,i) => {
  const from = Math.min(...s.menu.map(m => m.price));
  const items = s.menu.map((m,j) => `
            <li><span class="nm">${esc(m.name)}</span><span class="du">${fmtMins(m.mins)}</span><span class="pr">${money(m.price)}</span>
              <button class="mini" type="button" data-book="${esc(s.slug)}:${j}" aria-label="Book ${esc(m.name)}">Book</button></li>`).join('');
  return `
    <li class="row" data-img="assets/img/${esc(s.image)}.webp">
      <h3><button class="row-h" type="button" aria-expanded="false" aria-controls="svc-${esc(s.slug)}">
        <span class="num">${String(i+1).padStart(2,'0')}</span>
        <span class="ttl">${esc(s.name)} <em>${esc(s.em)}</em></span>
        <span class="from">from ${money(from)}</span>
        <span class="plus" aria-hidden="true"></span>
      </button></h3>
      <div class="row-b" id="svc-${esc(s.slug)}" role="region" aria-label="${esc(s.name)} ${esc(s.em)} prices"><div class="row-clip"><div class="row-in shell">
        <img src="assets/img/${esc(s.image)}.webp" alt="${esc(s.name)} ${esc(s.em)} at ${esc(site.name)}" loading="lazy" width="880" height="1100">
        <div>
          <p class="bl">${esc(s.blurb)}</p>
          <ul class="menu">${items}
          </ul>
        </div>
      </div></div></div>
    </li>`; }).join('');

/* ---------- shop ---------- */
const count = slug => shop.products.filter(p => p.featured && p.cat === slug).length;
const COLLECTIONS = shop.categories.map((c,i) => `
      <button class="col rv" style="--i:${i}" type="button" data-cat="${esc(c.slug)}">
        <span class="col-im"><img src="assets/img/${esc(c.image)}.webp" alt="" loading="lazy" width="900" height="1350" style="object-position:${esc(c.focus||'50% 50%')}"></span>
        <span class="lbl"><b>${esc(c.name)}</b><small>${count(c.slug)} style${count(c.slug)===1?'':'s'} <span aria-hidden="true">&rarr;</span></small></span>
      </button>`).join('');
const FILTERS = shop.categories.map(c =>
  `<button class="chip" type="button" data-cat="${esc(c.slug)}" aria-pressed="false">${esc(c.name)}</button>`).join('');

const shadeBy = Object.fromEntries(shop.shades.map(s => [s.code, s]));
const PRODUCTS = shop.products.filter(p => p.featured).map((p,i) => {
  const lens = p.options.map((o,j) =>
    `<button class="len" type="button" data-price="${o.price}" aria-pressed="${j===0}">${esc(o.length)}</button>`).join('');
  const dots = p.shades.map((c,j) => { const t = shadeBy[c].tone;
    return `<button class="dot" type="button" data-shade="${esc(c)}" aria-pressed="${j===0}" aria-label="Shade ${esc(c)}, ${esc(shadeBy[c].name)}" title="${esc(c)} ${esc(shadeBy[c].name)}" style="--b:${t[1]};--l:${t[2]}"></button>`; }).join('');
  const first = p.shades[0];
  return `
      <article class="prod rv" style="--i:${i}" data-id="${esc(p.id)}" data-name="${esc(p.name)}" data-cat="${esc(p.cat)}" data-shades="${esc(p.shades.join(','))}">
        <div class="im">
          <img src="assets/img/${esc(p.image)}.webp" alt="${esc(p.name)}" loading="lazy" width="880" height="1100">
          ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}
          <button class="fav" type="button" aria-pressed="false" aria-label="Save ${esc(p.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg></button>
        </div>
        <div class="bd">
          <h3>${esc(p.name)}</h3>
          <p class="bl">${esc(p.blurb)}</p>
          ${p.shades.length ? `<div class="shd"><div class="dots" role="group" aria-label="Shade">${dots}</div><span class="shd-nm">${esc(first)} &middot; ${esc(shadeBy[first].name)}</span></div>` : ''}
          <div class="lens" role="group" aria-label="${p.cat==='care'?'Size':'Length'}">${lens}</div>
          <div class="buy"><p class="price">${money(p.options[0].price)}</p><button class="add" type="button">Add to bag</button></div>
        </div>
      </article>`; }).join('');

/* ---------- shades ---------- */
const availIn = code => shop.products.filter(p => p.featured && p.shades.includes(code)).map(p => p.name);
const panel = s => `<p class="code">${esc(s.code)}</p><h3>${esc(s.name)}</h3><p class="note">${esc(s.note)}</p>
        <p class="avail"><b>Comes in</b> ${availIn(s.code).map(esc).join(', ') || 'Special order, ask in the studio'}</p>
        <button class="btn pill" type="button" id="shopShade" data-shade="${esc(s.code)}">Shop shade ${esc(s.code)} <span class="arr" aria-hidden="true">&rarr;</span></button>`;
const firstShade = shadeBy['1B'] || shop.shades[0];
const STRANDS = shop.shades.map((s,i) => `
        <button class="strand" type="button" style="--i:${i};--d:${s.tone[0]};--b:${s.tone[1]};--l:${s.tone[2]}" data-shade="${esc(s.code)}" aria-pressed="${s===firstShade}" aria-label="${esc(s.code)} ${esc(s.name)}">
          <span class="clip" aria-hidden="true"></span><span class="hair" aria-hidden="true"></span><span class="lbl">${esc(s.code)}</span>
        </button>`).join('');

/* ---------- why / work ---------- */
const ICONS = {
  look: '<circle cx="21" cy="21" r="12"/><path d="M30 30l10 10"/><path d="M15 25c2-6 4-8 6-8s3 5 6 5"/>',
  tag:  '<path d="M8 8h16l18 18-16 16L8 24Z"/><circle cx="17" cy="17" r="3"/><path d="M24 30c3-2 5-5 5-9"/>',
  moon: '<path d="M34 30A15 15 0 1 1 22 8a12 12 0 0 0 12 22Z"/><path d="M36 8v6M33 11h6"/>'
};
const WHY = site.why.map((w,i) => `
      <li class="rv" style="--i:${i}"><svg class="ic" viewBox="0 0 48 48" aria-hidden="true">${ICONS[w.icon] || ''}</svg><span class="n">${String(i+1).padStart(2,'0')}</span><h3>${esc(w.t)}</h3><p>${esc(w.d)}</p></li>`).join('');
const WORK_ITEMS = [
  ['work-1','Sleek braided pony'], ['work-2','Silver braid updo'], ['work-3','Mid-back box braids'],
  ['work-4','Natural shape &amp; trim'], ['work-5','Feed-in cornrows'], ['work-6','Chunky twists']];
const WORK = WORK_ITEMS.map(([f,c],i) => `
      <figure class="w w${i+1} rv" style="--i:${i}"><img src="assets/img/${img(f)}.webp" alt="${c}" loading="lazy" width="900" height="1300"><figcaption>${c}</figcaption></figure>`).join('');

/* ---------- booking ---------- */
const BOOK_OPTIONS = svc.services.map(s => `
        <optgroup label="${esc(s.name)} ${esc(s.em)}">${s.menu.map((m,j) =>
          `<option value="${esc(s.slug)}:${j}">${esc(m.name)}, ${fmtMins(m.mins)}, ${money(m.price)}</option>`).join('')}</optgroup>`).join('');

/* ---------- hours, grouped from the schedule ---------- */
const DAYN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const t12 = hm => { let [h,m] = hm.split(':').map(Number); const ap = h>=12?'pm':'am'; h = h%12||12; return m ? `${h}:${String(m).padStart(2,'0')}${ap}` : `${h}${ap}`; };
const order = [2,3,4,5,6,0,1], groups = [];
order.forEach(d => { const v = days[d], key = v ? v.join('-') : 'closed', last = groups[groups.length-1];
  if (last && last.key === key) last.days.push(d); else groups.push({ key, days:[d], v }); });
const HOURS = groups.map(g => {
  const label = g.days.length === 1 ? DAYN[g.days[0]] : g.days.length === 2 ? `${DAYN[g.days[0]]} &amp; ${DAYN[g.days[1]]}` : `${DAYN[g.days[0]]} to ${DAYN[g.days.at(-1)]}`;
  return `<li><span>${label}</span><span>${g.v ? `${t12(g.v[0])} to ${t12(g.v[1])}` : 'Closed'}</span></li>`; }).join('');

/* ---------- marquee + tools ---------- */
const mq = site.marquee.map(m => `<span>${esc(m)}</span><i>&#10022;</i>`).join('');
const MARQUEE = mq + mq + mq + mq;

const TOOLS = `
  <svg class="tool t-scissors" data-speed="-0.18" viewBox="0 0 120 120" aria-hidden="true">
    <polygon points="61.3,66.0 117.1,43.5 58.7,58.0 51.6,62.1 53.2,66.9" fill="#D9B872"/>
    <polygon points="63.7,64.0 88.2,9.0 56.3,60.0 54.0,67.9 58.5,70.2" fill="#C9A45A"/>
    <g fill="none" stroke="#B8924A" stroke-width="4.5" stroke-linecap="round">
      <path d="M60 62 L49.7 81.4"/><path d="M60 62 L39.1 68.8"/>
      <circle cx="44" cy="92" r="10"/><circle cx="27.7" cy="72.5" r="10"/></g>
    <circle cx="60" cy="62" r="3.2" fill="#8A6A2C"/>
  </svg>
  <svg class="tool t-dryer" data-speed="0.14" viewBox="0 0 160 150" aria-hidden="true">
    <rect x="78" y="34" width="70" height="30" rx="7" fill="#F2B3C7"/>
    <rect x="140" y="30" width="14" height="38" rx="4" fill="#C9A45A"/>
    <circle cx="60" cy="49" r="38" fill="#F4BFD0"/><circle cx="60" cy="49" r="24" fill="#F8D5E1"/>
    <circle cx="60" cy="49" r="10" fill="#C9A45A"/>
    <rect x="50" y="78" width="22" height="58" rx="10" fill="#EFA9BF" transform="rotate(-8 61 107)"/>
    <path d="M58 136 C 54 146, 44 148, 36 146" fill="none" stroke="#C9A45A" stroke-width="3" stroke-linecap="round"/>
  </svg>
  <svg class="tool t-brush" data-speed="0.22" viewBox="0 0 70 190" aria-hidden="true">
    <rect x="22" y="104" width="26" height="80" rx="13" fill="#F2B3C7"/>
    <rect x="24" y="96" width="22" height="12" rx="3" fill="#B8924A"/>
    <rect x="12" y="8" width="46" height="90" rx="10" fill="#C9A45A"/>
    <g fill="#8A6A2C">${Array.from({length:24},(_,k)=>`<circle cx="${18+(k%4)*11.5}" cy="${16+Math.floor(k/4)*14}" r="2.4"/>`).join('')}</g>
  </svg>
  <svg class="tool t-comb" data-speed="-0.12" viewBox="0 0 170 60" aria-hidden="true">
    <rect x="6" y="6" width="158" height="16" rx="6" fill="#F4BFD0"/>
    <g fill="#F4BFD0">${Array.from({length:19},(_,k)=>`<rect x="${10+k*8}" y="18" width="4.4" height="${k<7?34:26}" rx="2"/>`).join('')}</g>
  </svg>
  <svg class="tool t-spark s1" data-speed="0.3" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#C9A45A"/></svg>
  <svg class="tool t-spark s2" data-speed="-0.25" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#EFA9BF"/></svg>`;

/* ---------- demo notice ---------- */
const d = site.demo || {};
const DEMOBAR = d.show ? `<div class="demo-bar" role="note"><p>${esc(d.text)}</p><span class="sep">&middot;</span>
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>` : '';
const DEMOFOOT = d.show ? `<div class="demo-foot">${esc(d.text)}
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>` : '';

/* ---------- structured data ---------- */
const JSONLD = JSON.stringify({
  '@context':'https://schema.org','@type':'HairSalon',
  name:`${site.name} ${site.tagline}`, description:site.intro, image:'assets/img/hero.webp',
  telephone:site.phone, email:site.email, priceRange:'$$',
  address:{'@type':'PostalAddress',streetAddress:site.address.line1,addressLocality:site.city,addressRegion:'IL',postalCode:'60647',addressCountry:'US'},
  openingHoursSpecification: Object.entries(days).filter(([,v]) => v).map(([k,v]) =>
    ({'@type':'OpeningHoursSpecification',dayOfWeek:DAYN[k],opens:v[0],closes:v[1]}))
}).replace(/</g,'\\u003c');

/* ---------- client data + script ---------- */
const CLIENT = {
  announce: site.announce,
  schedule: { days, every: site.schedule.slotEvery, tz: site.schedule.timezone || 'America/Chicago' },
  depositOver: svc.depositOver, deposit: svc.deposit, freeShip: 150,
  services: Object.fromEntries(svc.services.map(s => [s.slug, s.menu.map(m => ({ n:m.name, m:m.mins, p:m.price }))])),
  shades: Object.fromEntries(shop.shades.map(s => [s.code, { n:s.name, note:s.note, avail:availIn(s.code) }]))
};
const SCRIPT = `<script>var HALO=${JSON.stringify(CLIENT).replace(/</g,'\\u003c')};</script>
<script src="assets/js/site.js" defer></script>`;

const vars = {
  NAME:esc(site.name), TAGLINE:esc(site.tagline), CITY:esc(site.city), NEIGHBORHOOD:esc(site.neighborhood),
  HERO_LEAD:esc(site.hero.lead), HERO_EM:esc(site.hero.em), HERO_SUB:esc(site.hero.sub),
  W_LEAD:esc(site.welcome.lead), W_EM:esc(site.welcome.em), W_TAIL:esc(site.welcome.tail), W_BODY:esc(site.welcome.body),
  INTRO_SHORT:esc(site.intro), ANNOUNCE_FIRST:esc(site.announce[0]),
  ADDR1:esc(site.address.line1), ADDR2:esc(site.address.line2),
  PHONE:esc(site.phone), PHONE_RAW:telRaw, EMAIL:esc(site.email), INSTAGRAM:esc(site.instagram),
  SVC_COUNT:svc.services.length, SHADE_COUNT:shop.shades.length,
  DEPOSIT:svc.deposit, DEPOSIT_HRS:svc.depositOver/60,
  SERVICE_ROWS, COLLECTIONS, FILTERS, PRODUCTS, STRANDS, SHADE_PANEL:panel(firstShade), WHY, WORK,
  BOOK_OPTIONS, HOURS, MARQUEE, TOOLS, DEMOBAR, DEMOFOOT, SCRIPT, JSONLD
};
const unknown = new Set();
const out = readFileSync('src/index.template.html','utf8')
  .replace(/\{\{(\w+)\}\}/g,(m,k)=> k in vars ? vars[k] : (unknown.add(k), m));
if (unknown.size) { console.error('  build failed: unknown tokens ' + [...unknown].join(', ')); process.exit(1); }
writeFileSync('index.html', out);
const variants = shop.products.reduce((n,p)=>n+p.options.length*Math.max(1,p.shades.length),0);
console.log(`  built index.html`);
console.log(`  ${svc.services.length} services, ${svc.services.reduce((n,s)=>n+s.menu.length,0)} menu items`);
console.log(`  ${shop.products.filter(p=>p.featured).length} products, ${shop.shades.length} shades, ${variants} shade x length variants`);
