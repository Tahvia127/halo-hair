/* Halo Hair Studio: page behaviour. Data comes from window.HALO, written by build.mjs. */
(function(){
'use strict';
var H = window.HALO, $ = function(s,r){return (r||document).querySelector(s)}, $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
var store = { get:function(k,d){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):d }catch(e){ return d } },
              set:function(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)) }catch(e){} } };
var money = function(n){ return '$'+Number(n).toLocaleString('en-US') };

$('#yr').textContent = new Date().getFullYear();

/* ---------- announcement ---------- */
(function(){
  var i = 0, el = $('#annText'), t;
  function show(n){ i = (n + H.announce.length) % H.announce.length; el.classList.add('out');
    setTimeout(function(){ el.textContent = H.announce[i]; el.classList.remove('out') }, 220); }
  function loop(){ clearInterval(t); if(!still) t = setInterval(function(){ show(i+1) }, 5200) }
  $('#annPrev').addEventListener('click', function(){ show(i-1); loop() });
  $('#annNext').addEventListener('click', function(){ show(i+1); loop() });
  loop();
})();

/* ---------- nav shadow ---------- */
var nav = $('#nav');
addEventListener('scroll', function(){ nav.classList.toggle('stuck', scrollY > 60) }, {passive:true});

/* ---------- reveal on scroll ---------- */
if('IntersectionObserver' in window && !still){
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){
    if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target) } }) },
    {rootMargin:'0px 0px -8% 0px', threshold:.06});
  $$('.rv').forEach(function(el){ io.observe(el) });
} else { $$('.rv').forEach(function(el){ el.classList.add('in') }) }

/* ---------- parallax: floating tools, watermark ---------- */
if(!still){
  var movers = $$('.tool'), wm = $('.wm'), welcome = $('#welcome'), work = $('.work'), ticking = false;
  function para(){
    ticking = false;
    var r = welcome.getBoundingClientRect(), p = Math.max(-1, Math.min(1, (r.top + r.height/2 - innerHeight/2) / innerHeight));
    movers.forEach(function(m){ m.style.setProperty('--py', (p * +m.dataset.speed * 320).toFixed(1)+'px') });
    if(wm){ var w = work.getBoundingClientRect(); wm.style.setProperty('--px', (Math.max(-1, Math.min(1, (w.top + w.height/2 - innerHeight/2) / innerHeight)) * -140).toFixed(1)+'px') }
  }
  addEventListener('scroll', function(){ if(!ticking){ ticking = true; requestAnimationFrame(para) } }, {passive:true});
  para();
}

/* ---------- service rows: accordion + cursor-following photo ---------- */
$$('.row-h').forEach(function(b){ b.addEventListener('click', function(){
  var open = b.getAttribute('aria-expanded') === 'true';
  b.setAttribute('aria-expanded', String(!open));
  b.closest('.row').classList.toggle('open', !open);
}) });
if(fine && !still){
  var peek = $('#peek'), tx = 0, ty = 0, x = 0, y = 0, raf = null, on = false;
  function step(){ x += (tx - x) * .16; y += (ty - y) * .16;
    peek.style.transform = 'translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) rotate('+((tx-x)*.04).toFixed(2)+'deg)';
    raf = (on || Math.abs(tx-x) > .5) ? requestAnimationFrame(step) : null; }
  $$('.row').forEach(function(row){
    var h = $('.row-h', row);
    h.addEventListener('mouseenter', function(e){ if(row.classList.contains('open')) return;
      peek.src = row.dataset.img; on = true; tx = x = e.clientX; ty = y = e.clientY; peek.classList.add('on'); if(!raf) raf = requestAnimationFrame(step) });
    h.addEventListener('mousemove', function(e){ tx = e.clientX; ty = e.clientY });
    h.addEventListener('mouseleave', function(){ on = false; peek.classList.remove('on') });
    h.addEventListener('click', function(){ on = false; peek.classList.remove('on') });
  });
}

/* ---------- shop: filters ---------- */
var cards = $$('.prod'), chips = $$('.chip'), state = { cat:'all', shade:null };
function applyFilters(){
  var shown = 0;
  cards.forEach(function(c){
    var ok = (state.cat === 'all' || c.dataset.cat === state.cat) &&
             (!state.shade || c.dataset.shades.split(',').indexOf(state.shade) > -1);
    if(ok && c.hidden){ c.hidden = false; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop') }
    else if(!ok) c.hidden = true;
    if(ok){ shown++; if(state.shade){ var dot = $('.dot[data-shade="'+state.shade+'"]', c); if(dot) dot.click() } }
  });
  chips.forEach(function(ch){ ch.setAttribute('aria-pressed', String(ch.dataset.cat === state.cat)) });
  $$('.col').forEach(function(t){ t.classList.toggle('on', t.dataset.cat === state.cat) });
  $('#shadeFilter').hidden = !state.shade;
  $('#shadeFilterCode').textContent = state.shade || '';
  $('#noneMsg').hidden = shown > 0;
}
chips.forEach(function(ch){ ch.addEventListener('click', function(){ state.cat = ch.dataset.cat; applyFilters() }) });
$$('.col').forEach(function(t){ t.addEventListener('click', function(){
  state.cat = state.cat === t.dataset.cat ? 'all' : t.dataset.cat; applyFilters();
  $('#pgrid').scrollIntoView({behavior: still ? 'auto' : 'smooth', block:'start'}) }) });
$('#shadeClear').addEventListener('click', function(){ state.shade = null; applyFilters() });
$('#resetFilters').addEventListener('click', function(){ state.cat = 'all'; state.shade = null; applyFilters() });

/* ---------- product cards: shade, length, save ---------- */
var saved = store.get('halo-saved', []);
cards.forEach(function(card){
  var lens = $$('.len', card), dots = $$('.dot', card), price = $('.price', card), nm = $('.shd-nm', card), fav = $('.fav', card);
  lens.forEach(function(b){ b.addEventListener('click', function(){
    lens.forEach(function(o){ o.setAttribute('aria-pressed', String(o === b)) });
    price.textContent = money(b.dataset.price); price.classList.remove('tick'); void price.offsetWidth; price.classList.add('tick') }) });
  dots.forEach(function(b){ b.addEventListener('click', function(){
    dots.forEach(function(o){ o.setAttribute('aria-pressed', String(o === b)) });
    nm.textContent = b.dataset.shade + ' · ' + H.shades[b.dataset.shade].n }) });
  var on = saved.indexOf(card.dataset.id) > -1;
  fav.setAttribute('aria-pressed', String(on));
  fav.addEventListener('click', function(){
    var i = saved.indexOf(card.dataset.id), now = i < 0;
    if(now) saved.push(card.dataset.id); else saved.splice(i,1);
    store.set('halo-saved', saved); fav.setAttribute('aria-pressed', String(now));
    fav.classList.remove('burst'); void fav.offsetWidth; if(now) fav.classList.add('burst') });
});

/* ---------- shade rack ---------- */
var strands = $$('.strand'), panel = $('#shPanel');
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] }) }
function pickShade(code){
  var s = H.shades[code];
  strands.forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.shade === code)) });
  panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
  panel.innerHTML = '<p class="code">'+esc(code)+'</p><h3>'+esc(s.n)+'</h3><p class="note">'+esc(s.note)+'</p>'+
    '<p class="avail"><b>Comes in</b> '+(s.avail.length ? s.avail.map(esc).join(', ') : 'Special order, ask in the studio')+'</p>'+
    (s.avail.length ? '<button class="btn pill" type="button" id="shopShade" data-shade="'+esc(code)+'">Shop shade '+esc(code)+' <span class="arr" aria-hidden="true">&rarr;</span></button>' : '');
}
strands.forEach(function(b){ b.addEventListener('click', function(){ pickShade(b.dataset.shade) }) });
panel.addEventListener('click', function(e){
  var b = e.target.closest('#shopShade'); if(!b) return;
  state.shade = b.dataset.shade; state.cat = 'all'; applyFilters();
  $('#shop').scrollIntoView({behavior: still ? 'auto' : 'smooth'});
});

/* ---------- bag ---------- */
var bag = store.get('halo-bag', []);
if(!Array.isArray(bag)) bag = [];
var elItems = $('#cartItems'), elCount = $('#cartCount'), elTotal = $('#cartTotal'), cart = $('#cart'), scrim = $('#scrim'),
    bagBtn = $('#cartOpen'), lastFocus = null;
function total(){ return bag.reduce(function(t,i){ return t + i.price * (i.qty||1) }, 0) }
function render(){
  var n = bag.reduce(function(t,i){ return t + (i.qty||1) }, 0), sum = total();
  elCount.textContent = n; bagBtn.setAttribute('aria-label', 'Open bag, ' + n + ' item' + (n===1?'':'s'));
  elTotal.textContent = money(sum);
  var left = H.freeShip - sum;
  $('#shipTxt').innerHTML = !n ? 'Free US shipping on hair orders over ' + money(H.freeShip) + '.' :
    left > 0 ? '<b>' + money(left) + '</b> away from free shipping.' : '<b>Free shipping</b> unlocked.';
  $('#shipFill').style.width = Math.min(100, sum / H.freeShip * 100) + '%';
  if(!n){ elItems.innerHTML = '<li class="empty">Your bag is empty.</li>'; return }
  elItems.innerHTML = bag.map(function(i,ix){
    return '<li><span class="n">'+esc(i.name)+'</span><span class="p">'+money(i.price*(i.qty||1))+'</span>'+
      '<span class="v">'+esc(i.length)+(i.shade ? ' · shade '+esc(i.shade) : '')+'</span>'+
      '<span class="q"><button type="button" data-ix="'+ix+'" data-d="-1" aria-label="One fewer '+esc(i.name)+'">&minus;</button><b>'+(i.qty||1)+'</b>'+
      '<button type="button" data-ix="'+ix+'" data-d="1" aria-label="One more '+esc(i.name)+'">+</button></span></li>' }).join('');
}
elItems.addEventListener('click', function(e){
  var b = e.target.closest('button[data-ix]'); if(!b) return;
  var it = bag[+b.dataset.ix]; it.qty = (it.qty||1) + (+b.dataset.d);
  if(it.qty < 1) bag.splice(+b.dataset.ix, 1);
  store.set('halo-bag', bag); render();
});
cards.forEach(function(card){
  $('.add', card).addEventListener('click', function(){
    var len = $('.len[aria-pressed="true"]', card) || $('.len', card), dot = $('.dot[aria-pressed="true"]', card);
    var item = { id:card.dataset.id, name:card.dataset.name, length:len.textContent, shade:dot ? dot.dataset.shade : '', price:+len.dataset.price, qty:1 };
    var same = bag.filter(function(i){ return i.id===item.id && i.length===item.length && i.shade===item.shade })[0];
    if(same) same.qty = (same.qty||1) + 1; else bag.push(item);
    store.set('halo-bag', bag); render(); openCart();
    var btn = this; btn.textContent = 'Added'; btn.classList.add('added');
    setTimeout(function(){ btn.textContent = 'Add to bag'; btn.classList.remove('added') }, 1300);
  });
});
function openCart(){ lastFocus = document.activeElement; cart.classList.add('open'); cart.setAttribute('aria-hidden','false');
  scrim.classList.add('on'); document.body.classList.add('locked'); setTimeout(function(){ $('#cartClose').focus() }, 60) }
function closeCart(){ if(!cart.classList.contains('open')) return; cart.classList.remove('open'); cart.setAttribute('aria-hidden','true');
  scrim.classList.remove('on'); document.body.classList.remove('locked'); if(lastFocus) lastFocus.focus() }
bagBtn.addEventListener('click', openCart);
$('#cartClose').addEventListener('click', closeCart);
scrim.addEventListener('click', closeCart);
addEventListener('keydown', function(e){
  if(e.key === 'Escape') closeCart();
  if(e.key === 'Tab' && cart.classList.contains('open')){
    var f = $$('button, a[href], select', cart), a = f[0], z = f[f.length-1];
    if(e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus() }
    else if(!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus() }
  }
});
$('#checkout').addEventListener('click', function(){
  var t = this;
  t.textContent = bag.length ? 'Demo only, no payment taken' : 'Your bag is empty';
  setTimeout(function(){ t.textContent = 'Checkout' }, 2200);
});
render();

/* ---------- booking ---------- */
var S = H.schedule, sel = $('#bkSvc'), daysEl = $('#bkDays'), timesEl = $('#bkTimes'), sum = $('#bkSum'), go = $('#bkGo'),
    pick = { day:null, time:null };
var WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function studioNow(){
  var p = {}; new Intl.DateTimeFormat('en-US', { timeZone:S.tz, year:'numeric', month:'numeric', day:'numeric', hour:'numeric', minute:'numeric', hourCycle:'h23' })
    .formatToParts(new Date()).forEach(function(x){ p[x.type] = +x.value });
  return { y:p.year, m:p.month, d:p.day, mins:(p.hour % 24) * 60 + p.minute };
}
function toMin(hm){ var a = hm.split(':'); return +a[0]*60 + +a[1] }
function t12(m){ var h = Math.floor(m/60), mm = m%60, ap = h >= 12 ? 'pm' : 'am'; h = h%12 || 12; return h + ':' + (mm<10?'0':'') + mm + ' ' + ap }
function dur(m){ var h = Math.floor(m/60), r = m%60; return h ? h + ' hr' + (h>1?'s':'') + (r ? ' ' + r + ' min' : '') : r + ' min' }
function svcNow(){ var v = sel.value.split(':'); return H.services[v[0]][+v[1]] }
function taken(key){ var h = 0; for(var i=0;i<key.length;i++){ h = (h*31 + key.charCodeAt(i)) >>> 0 } return h % 100 < 28 }
function slotsFor(day, mins){
  var hrs = S.days[day.dow]; if(!hrs) return [];
  var open = toMin(hrs[0]), close = toMin(hrs[1]), out = [], now = studioNow();
  for(var t = open; t + mins <= close; t += S.every){
    if(day.today && t < now.mins + 60) continue;
    out.push({ t:t, busy:taken(day.key + '|' + t) });
  }
  return out;
}
function openDays(){
  var n = studioNow(), out = [];
  for(var i = 0; out.length < 8 && i < 21; i++){
    var dt = new Date(Date.UTC(n.y, n.m-1, n.d + i)), dow = dt.getUTCDay();
    if(!S.days[dow]) continue;
    out.push({ key:dt.toISOString().slice(0,10), dow:dow, today:i===0, label:WD[dow], date:dt.getUTCDate(), mon:MO[dt.getUTCMonth()] });
  }
  return out;
}
var DAYS = [];
function drawDays(){
  var s = svcNow();
  DAYS = openDays().filter(function(d){ return slotsFor(d, s.m).some(function(x){ return !x.busy }) });
  if(!DAYS.some(function(d){ return d.key === pick.day })) pick.day = DAYS.length ? DAYS[0].key : null;
  daysEl.innerHTML = DAYS.map(function(d){
    return '<button type="button" role="radio" class="day" data-key="'+d.key+'" aria-checked="'+(d.key===pick.day)+'">'+
      '<small>'+(d.today ? 'Today' : d.label)+'</small><b>'+d.date+'</b><small>'+d.mon+'</small></button>' }).join('') ||
    '<p class="fine">No openings for this service in the next three weeks. Call us and we will find you a time.</p>';
  drawTimes();
}
function drawTimes(){
  var s = svcNow(), day = DAYS.filter(function(d){ return d.key === pick.day })[0];
  var sl = day ? slotsFor(day, s.m) : [];
  if(!sl.some(function(x){ return x.t === pick.time && !x.busy })) pick.time = null;
  timesEl.innerHTML = sl.map(function(x){
    return '<button type="button" role="radio" class="time" data-t="'+x.t+'" aria-checked="'+(x.t===pick.time)+'"'+(x.busy?' disabled aria-label="'+t12(x.t)+', booked"':'')+'>'+t12(x.t)+'</button>' }).join('');
  drawSum();
}
function drawSum(){
  var s = svcNow(), day = DAYS.filter(function(d){ return d.key === pick.day })[0], dep = s.m >= H.depositOver;
  if(!day || pick.time === null){
    sum.innerHTML = '<p><b>'+esc(s.n)+'</b> &middot; '+dur(s.m)+' &middot; '+money(s.p)+(dep ? ' &middot; '+money(H.deposit)+' deposit' : '')+'</p>';
    go.disabled = true; go.textContent = 'Choose a time'; return;
  }
  sum.innerHTML = '<p><b>'+esc(s.n)+'</b></p><p>'+(day.today?'Today':day.label)+' '+day.date+' '+day.mon+', '+t12(pick.time)+' to '+t12(pick.time + s.m)+'</p>'+
    '<p>'+money(s.p)+(dep ? ' &middot; <b>'+money(H.deposit)+' deposit</b> holds the chair' : ' &middot; pay in the studio')+'</p>';
  go.disabled = false; go.textContent = 'Confirm ' + t12(pick.time) + ', ' + (day.today?'today':day.label + ' ' + day.date);
}
daysEl.addEventListener('click', function(e){ var b = e.target.closest('.day'); if(!b) return; pick.day = b.dataset.key; pick.time = null;
  $$('.day', daysEl).forEach(function(o){ o.setAttribute('aria-checked', String(o === b)) }); drawTimes() });
timesEl.addEventListener('click', function(e){ var b = e.target.closest('.time'); if(!b || b.disabled) return; pick.time = +b.dataset.t;
  $$('.time', timesEl).forEach(function(o){ o.setAttribute('aria-checked', String(o === b)) }); drawSum() });
function arrowKeys(box, cls){ box.addEventListener('keydown', function(e){
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(e.key) < 0) return;
  var list = $$(cls+':not([disabled])', box), i = list.indexOf(document.activeElement); if(i < 0) return;
  e.preventDefault(); var n = list[(i + (e.key==='ArrowLeft'||e.key==='ArrowUp' ? -1 : 1) + list.length) % list.length]; n.focus(); n.click() }) }
arrowKeys(daysEl, '.day'); arrowKeys(timesEl, '.time');
sel.addEventListener('change', drawDays);
$('#bkForm').addEventListener('submit', function(e){ e.preventDefault(); if(go.disabled) return;
  var t = go.textContent; go.textContent = 'Demo only, nothing was booked'; go.classList.add('done');
  setTimeout(function(){ go.textContent = t; go.classList.remove('done') }, 2400) });
$$('[data-book]').forEach(function(b){ b.addEventListener('click', function(){
  sel.value = b.dataset.book; drawDays();
  $('#book').scrollIntoView({behavior: still ? 'auto' : 'smooth'}); setTimeout(function(){ sel.focus({preventScroll:true}) }, still ? 0 : 700) }) });
drawDays();

/* ---------- open now (studio time, not the visitor's) ---------- */
(function(){
  var n = studioNow(), dow = new Date(Date.UTC(n.y, n.m-1, n.d)).getUTCDay(), h = S.days[dow], el = $('#openNow');
  if(h && n.mins >= toMin(h[0]) && n.mins < toMin(h[1])){ el.innerHTML = '<i class="live"></i>Open now, until ' + t12(toMin(h[1])); el.classList.add('is-open') }
  else { for(var i=1;i<=7;i++){ var dd = (dow+i)%7; if(S.days[dd]){ el.textContent = 'Closed now. Opens ' + (i===1?'tomorrow':WD[dd]) + ' at ' + t12(toMin(S.days[dd][0])); break } } }
  if(h && n.mins < toMin(h[0])) el.textContent = 'Opens today at ' + t12(toMin(h[0]));
})();
})();
