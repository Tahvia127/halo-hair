/* Halo Hair Studio — static build. Reads data/, writes index.html. No dependencies. */
import { readFileSync, writeFileSync } from 'node:fs';

const site = JSON.parse(readFileSync('data/site.json','utf8'));
const svc  = JSON.parse(readFileSync('data/services.json','utf8'));
const shop = JSON.parse(readFileSync('data/shop.json','utf8'));

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const money = n => '$' + Number(n).toFixed(Number(n)%1 ? 2 : 0);
const telRaw = site.phone.replace(/[^\d+]/g,'');

const SERVICES = svc.services.map((s,i) => `
      <a class="svc rv" style="--i:${i}" href="#book">
        <img src="assets/img/${esc(s.image)}.webp" alt="${esc(s.name)} at ${esc(site.name)}" loading="lazy" width="900" height="1080">
        <div class="cap">
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.blurb)}</p>
          <span class="from">From ${money(s.from)}</span>
        </div>
      </a>`).join('');

const SERVICE_MENU = svc.services.map(s => `
      <div class="rv">
        <h4>${esc(s.name)}</h4>
        <ul>${s.menu.map(m => `
          <li>
            <div class="row"><span class="nm">${esc(m.name)}</span><span class="dot"></span><span class="pr">${money(m.price)}</span></div>
            <span class="du">${esc(m.duration)}</span>
          </li>`).join('')}
        </ul>
      </div>`).join('');

const PRODUCTS = shop.products.filter(p=>p.featured).map((p,i) => {
  const opts = p.options.map((o,j) =>
    `<button class="len" type="button" data-price="${o.price}" aria-pressed="${j===0}">${esc(o.length)}</button>`).join('');
  return `
      <article class="prod rv" style="--i:${i}" data-id="${esc(p.id)}" data-name="${esc(p.name)}">
        <div class="im"><img src="assets/img/${esc(p.image)}.webp" alt="${esc(p.name)}" loading="lazy" width="800" height="896"></div>
        <div class="bd">
          <h3>${esc(p.name)}</h3>
          <p class="bl">${esc(p.blurb)}</p>
          <div class="lens" role="group" aria-label="Length for ${esc(p.name)}">${opts}</div>
          <p class="price">${money(p.options[0].price)}</p>
          <button class="add" type="button">Add to bag</button>
        </div>
      </article>`;
}).join('');

const GALLERY = ['gal-1','gal-2','gal-3','gal-4','interior'].map((g,i) =>
  `<a class="rv" style="--i:${i}" href="#book" aria-label="Book an appointment"><img src="assets/img/${g}.webp" alt="" loading="lazy" width="700" height="805"></a>`).join('');

const HOURS = site.hours.map(h => `<li class="hrs"><span>${esc(h.days)}</span><span>${esc(h.time)}</span></li>`).join('');

const d = site.demo || {};
const DEMOBAR = d.show ? `<div class="demo-bar" role="note"><p>${esc(d.text)}</p><span class="sep">&middot;</span>
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>` : '';
const DEMOFOOT = d.show ? `<div class="demo-foot">${esc(d.text)}
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>` : '';

const JSONLD = JSON.stringify({
  '@context':'https://schema.org','@type':'HairSalon',
  name:`${site.name} ${site.tagline}`, description:site.intro,
  telephone:site.phone, email:site.email, priceRange:'$$',
  address:{'@type':'PostalAddress',streetAddress:site.address.line1,addressLocality:site.city}
});

const SCRIPT = `<script>
document.getElementById('yr').textContent=new Date().getFullYear();
var MARQ=${JSON.stringify(site.marquee)};
document.getElementById('track').innerHTML=MARQ.concat(MARQ).concat(MARQ).concat(MARQ)
  .map(function(m){return '<span>'+m+' \\u2726</span>'}).join('');

var nav=document.getElementById('nav');
addEventListener('scroll',function(){nav.classList.toggle('stuck',scrollY>12)},{passive:true});

if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},
    {rootMargin:'0px 0px -8% 0px',threshold:.05});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
}else{document.querySelectorAll('.rv').forEach(function(el){el.classList.add('in')})}

/* ---- length picker ---- */
document.querySelectorAll('.prod').forEach(function(card){
  var lens=card.querySelectorAll('.len'), price=card.querySelector('.price');
  lens.forEach(function(b){ b.addEventListener('click',function(){
    lens.forEach(function(o){o.setAttribute('aria-pressed',String(o===b))});
    price.textContent='$'+b.dataset.price;
  })});
});

/* ---- bag ---- */
var KEY='halo-bag', bag=[];
try{ bag=JSON.parse(localStorage.getItem(KEY)||'[]') }catch(e){ bag=[] }
var elItems=document.getElementById('cartItems'), elCount=document.getElementById('cartCount'),
    elTotal=document.getElementById('cartTotal'), cart=document.getElementById('cart'),
    scrim=document.getElementById('scrim');

function save(){ try{ localStorage.setItem(KEY,JSON.stringify(bag)) }catch(e){} }
function render(){
  elCount.textContent=bag.length;
  elTotal.textContent='$'+bag.reduce(function(t,i){return t+i.price},0);
  if(!bag.length){ elItems.innerHTML='<li class="empty">Your bag is empty.</li>'; return }
  elItems.innerHTML=bag.map(function(i,ix){
    return '<li><span class="n">'+i.name+'</span><span class="p">$'+i.price+'</span>'+
           '<span class="v">'+i.length+'</span>'+
           '<button class="rm" type="button" data-ix="'+ix+'">Remove</button></li>'}).join('');
}
elItems.addEventListener('click',function(e){
  var b=e.target.closest('.rm'); if(!b) return;
  bag.splice(+b.dataset.ix,1); save(); render();
});
document.querySelectorAll('.prod').forEach(function(card){
  card.querySelector('.add').addEventListener('click',function(){
    var sel=card.querySelector('.len[aria-pressed="true"]')||card.querySelector('.len');
    bag.push({id:card.dataset.id,name:card.dataset.name,length:sel.textContent,price:+sel.dataset.price});
    save(); render(); openCart();
    var btn=this; btn.textContent='Added'; btn.classList.add('added');
    setTimeout(function(){btn.textContent='Add to bag'; btn.classList.remove('added')},1200);
  });
});
function openCart(){ cart.classList.add('open'); cart.setAttribute('aria-hidden','false'); scrim.classList.add('on') }
function closeCart(){ cart.classList.remove('open'); cart.setAttribute('aria-hidden','true'); scrim.classList.remove('on') }
document.getElementById('cartOpen').addEventListener('click',openCart);
document.getElementById('cartClose').addEventListener('click',closeCart);
scrim.addEventListener('click',closeCart);
addEventListener('keydown',function(e){ if(e.key==='Escape') closeCart() });
document.getElementById('checkout').addEventListener('click',function(){
  if(!bag.length){ this.textContent='Bag is empty'; var t=this; setTimeout(function(){t.textContent='Checkout'},1400); return }
  this.textContent='Demo only \\u2014 no payment taken';
  var t=this; setTimeout(function(){t.textContent='Checkout'},2200);
});
render();

/* ---- booking slots ---- */
var slots=document.querySelectorAll('.slot:not([disabled])'), cta=document.getElementById('bookCta');
slots.forEach(function(s){ s.addEventListener('click',function(){
  slots.forEach(function(o){o.setAttribute('aria-pressed',String(o===s))});
  cta.textContent='Confirm '+s.textContent+' Saturday';
})});
</script>`;

const vars = {
  NAME:esc(site.name), TAGLINE:esc(site.tagline), CITY:esc(site.city),
  H1A:esc(site.hero.line1), H1B:esc(site.hero.line2), HSUB:esc(site.hero.sub),
  INTRO:esc(site.intro), INTRO_SHORT:esc(site.intro.split('. ').slice(0,2).join('. ')+'.'),
  ADDR1:esc(site.address.line1), ADDR2:esc(site.address.line2),
  PHONE:esc(site.phone), PHONE_RAW:telRaw, EMAIL:esc(site.email), INSTAGRAM:esc(site.instagram),
  SERVICES, SERVICE_MENU, PRODUCTS, GALLERY, HOURS, DEMOBAR, DEMOFOOT, SCRIPT, JSONLD
};
const out = readFileSync('src/index.template.html','utf8')
  .replace(/\{\{(\w+)\}\}/g,(m,k)=> k in vars ? vars[k] : (console.warn('  ! unknown token',k),m));
writeFileSync('index.html', out);
console.log(`  built index.html`);
console.log(`  ${svc.services.length} services, ${shop.products.filter(p=>p.featured).length} products, ${shop.products.reduce((n,p)=>n+p.options.length,0)} variants`);
