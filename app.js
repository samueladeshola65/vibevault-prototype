/* VIBEVAULT ticketing prototype
   Static front end only. Data lives in localStorage. Payments, email and "server" checks are simulated.
   Every function marked SERVER below must become a real backend endpoint in production. */
(function () {
'use strict';

/* ---------- config ---------- */
const STORE_KEY = 'vv_proto_v1';
const WHATSAPP = '2348000000000'; // placeholder, replace with real WhatsApp Business number
const SUPPORT_EMAIL = 'support@vibevault.example'; // placeholder until the domain is bought
const CATEGORIES = [
  { n: 'Rave', i: '⚡' }, { n: 'Party', i: '🎉' }, { n: 'Concert', i: '🎤' },
  { n: 'Fashion', i: '👗' }, { n: 'Comedy', i: '😂' }, { n: 'Brunch', i: '🥂' }
];
const CITIES = [{ n: 'Lagos', s: 'Lagos' }, { n: 'Oyo', s: 'Ibadan and Oyo State' }, { n: 'Abuja', s: 'FCT' }];
const GRADS = [
  ['#E5122B', '#1a0004'], ['#FF5A1F', '#1b0600'], ['#7a0017', '#000'], ['#E5122B', '#FF5A1F'],
  ['#3b0a3f', '#E5122B'], ['#111', '#E5122B'], ['#FF5A1F', '#3b0010'], ['#2b0000', '#FF4D5F']
];

/* ---------- helpers ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const h = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const naira = n => '₦' + Math.round(n).toLocaleString('en-NG');
const uid = (p) => p + Math.random().toString(36).slice(2, 8);
const now = () => Date.now();
function secureCode(len) { // long random ticket code, never sequential
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const buf = new Uint8Array(len); crypto.getRandomValues(buf);
  return Array.from(buf, b => a[b % a.length]).join('');
}
function fmtDate(ts, opt) { return new Date(ts).toLocaleString('en-NG', opt || { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtTime(ts) { return new Date(ts).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }); }
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- state ---------- */
let S;
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { toast('Storage full. Remove a big poster image.'); } }
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { S = JSON.parse(raw); return; } } catch (e) {}
  S = seed(); save();
}
function resetDemo() { localStorage.removeItem(STORE_KEY); load(); location.hash = '#/'; render(); toast('Demo data reset'); }

function seed() {
  const D = 86400000, base = new Date(); base.setHours(0, 0, 0, 0);
  const at = (days, hr) => base.getTime() + days * D + hr * 3600000;
  const st = {
    settings: { feePct: 5, minFee: 0, holdMinutes: 10, approveEvents: false, promoPrice: 15000 },
    session: { role: 'guest', hostId: null },
    hosts: [
      { id: 'h1', name: 'VIBEVAULT', email: 'events@vibevault.example', phone: '+234 800 000 0001', status: 'approved', bank: { bank: 'Access Bank', acct: '0123456789', name: 'VIBEVAULT ENTERTAINMENT', verified: true }, about: 'Same People. New Vibes. The VIBEVAULT crew runs the nights and the platform.' },
      { id: 'h2', name: 'Lagos Nights', email: 'hello@lagosnights.example', phone: '+234 800 000 0002', status: 'approved', bank: { bank: 'GTBank', acct: '0222333444', name: 'LAGOS NIGHTS LTD', verified: true }, about: 'Island parties and rooftop sessions across Lagos since 2019.' },
      { id: 'h3', name: 'Ibadan Social Club', email: 'team@ibadansocial.example', phone: '+234 800 000 0003', status: 'approved', bank: null, about: 'The social calendar of the Oyo State scene.' },
      { id: 'h4', name: 'Owambe Collective', email: 'owambe@collective.example', phone: '+234 800 000 0004', status: 'pending', bank: null, about: 'Culture, food and music for every celebration.' }
    ],
    events: [], orders: [], tickets: [], holds: [], subscribers: [], messages: [], saved: [], scanQueue: [],
    flags: [{ id: 'f1', note: 'Email pattern: 6 orders in 4 minutes from one address', status: 'open' }]
  };
  const T = (id, name, price, qty, gender) => ({ id, name, price, qty, gender: gender || 'any', saleStart: null, saleEnd: null, max: 4 });
  const lorem = 'Doors open at 8 PM. Expect heavy sound, bright lights and a crowd that came to move. Dress sharp, bring your ID and arrive early to skip the queue. Your QR ticket is checked once at the door.';
  st.events = [
    { id: 'e1', hostId: 'h1', title: 'Vault Opening Night', category: 'Rave', city: 'Lagos', venue: 'The Vault Lounge, Victoria Island', date: at(9, 21), desc: 'The first official VIBEVAULT night. Three floors, two DJs and one rule: no one leaves early. ' + lorem, status: 'live', promoted: true, absorbFee: false, doorPin: '4821', grad: 0, img: null, payout: 'none',
      tiers: [T('t1', 'Early Bird Female', 2000, 120, 'female'), T('t2', 'Early Bird Male', 3000, 120, 'male'), T('t3', 'Regular', 5000, 200), T('t4', 'VIP Table (4 seats)', 10000, 30)] },
    { id: 'e2', hostId: 'h3', title: 'Ibadan After Dark', category: 'Party', city: 'Oyo', venue: 'Jericho Rooftop, Ibadan', date: at(6, 20), desc: 'Ibadan\'s rooftop party returns with live sax, Afrobeats and amapiano. ' + lorem, status: 'live', promoted: false, absorbFee: false, doorPin: '1357', grad: 1, img: null, payout: 'none',
      tiers: [T('t1', 'General', 2000, 250), T('t2', 'VIP', 5000, 60)] },
    { id: 'e3', hostId: 'h2', title: 'Abuja Afrobeats Live', category: 'Concert', city: 'Abuja', venue: 'Wuse II Event Centre, Abuja', date: at(16, 18), desc: 'A full live band concert with three headline acts. ' + lorem, status: 'live', promoted: true, absorbFee: false, doorPin: '2468', grad: 3, img: null, payout: 'none',
      tiers: [T('t1', 'Regular', 5000, 400), T('t2', 'VIP', 10000, 120), T('t3', 'VVIP', 25000, 20)] },
    { id: 'e4', hostId: 'h2', title: 'Sunday Owambe Brunch', category: 'Brunch', city: 'Lagos', venue: 'Lekki Phase 1 Garden, Lagos', date: at(3, 12), desc: 'Jollof, small chops, bottomless drinks and a DJ who knows your mum\'s favourite songs. ' + lorem, status: 'live', promoted: false, absorbFee: true, doorPin: '9090', grad: 6, img: null, payout: 'none',
      tiers: [T('t1', 'Brunch Pass', 7500, 80), T('t2', 'Group of 4', 25000, 15)] },
    { id: 'e5', hostId: 'h1', title: 'Runway Nights', category: 'Fashion', city: 'Lagos', venue: 'Landmark Event Centre, Oniru', date: at(23, 19), desc: 'Eight designers, one runway, one night. ' + lorem, status: 'live', promoted: false, absorbFee: false, doorPin: '7531', grad: 4, img: null, payout: 'none',
      tiers: [T('t1', 'Standing', 3000, 200), T('t2', 'Front Row', 15000, 40)] },
    { id: 'e6', hostId: 'h2', title: 'Laugh Out Vault', category: 'Comedy', city: 'Lagos', venue: 'Terra Kulture, Victoria Island', date: at(12, 18), desc: 'Stand up night with four of the funniest voices in the country. ' + lorem, status: 'live', promoted: false, absorbFee: false, doorPin: '8642', grad: 2, img: null, payout: 'none',
      tiers: [T('t1', 'Regular', 3000, 150), T('t2', 'Front Seats', 6000, 6)] },
    { id: 'e7', hostId: 'h1', title: 'Glow Rave Abuja', category: 'Rave', city: 'Abuja', venue: 'Jabi Lake Arena, Abuja', date: at(30, 21), desc: 'Neon paint, laser walls and the loudest system in the capital. ' + lorem, status: 'live', promoted: false, absorbFee: false, doorPin: '1122', grad: 5, img: null, payout: 'none',
      tiers: [T('t1', 'Early Bird', 3500, 100), T('t2', 'Regular', 6000, 300)] },
    { id: 'e8', hostId: 'h3', title: 'Campus Cruise', category: 'Party', city: 'Oyo', venue: 'Bodija Garden, Ibadan', date: at(20, 16), desc: 'The semester closer for every student in Ibadan. ' + lorem, status: 'live', promoted: false, absorbFee: false, doorPin: '3344', grad: 7, img: null, payout: 'none',
      tiers: [T('t1', 'Student', 1500, 300), T('t2', 'Non Student', 2500, 150)] },
    { id: 'e9', hostId: 'h1', title: 'Vault Halloween Bash', category: 'Party', city: 'Lagos', venue: 'The Vault Lounge, Victoria Island', date: at(-18, 21), desc: 'Last month\'s costume night. ' + lorem, status: 'live', promoted: false, absorbFee: false, doorPin: '5566', grad: 2, img: null, payout: 'requested',
      tiers: [T('t1', 'Regular', 4000, 150), T('t2', 'VIP', 10000, 30)] },
    { id: 'e10', hostId: 'h2', title: 'Lagos Nights: Rooftop Sessions (draft)', category: 'Party', city: 'Lagos', venue: 'To be confirmed', date: at(40, 20), desc: 'Draft event, not yet published.', status: 'draft', promoted: false, absorbFee: false, doorPin: '6789', grad: 1, img: null, payout: 'none', tiers: [T('t1', 'General', 3000, 100)] },
    { id: 'e11', hostId: 'h4', title: 'Owambe Cultural Night', category: 'Party', city: 'Lagos', venue: 'Ikeja GRA Hall, Lagos', date: at(27, 17), desc: 'Waiting for VIBEVAULT approval. ' + lorem, status: 'pending', promoted: false, absorbFee: false, doorPin: '2020', grad: 6, img: null, payout: 'none', tiers: [T('t1', 'Regular', 4000, 200)] }
  ];
  // generate sales
  const rnd = mulberry(42);
  const names = ['Tunde Adeyemi', 'Chioma Okafor', 'Bola Ajayi', 'Ngozi Eze', 'Emeka Obi', 'Aisha Bello', 'Kemi Balogun', 'Seun Ogunleye', 'Funke Adebayo', 'Ibrahim Musa', 'Zainab Yusuf', 'Dayo Williams', 'Tola Akinde', 'Uche Nwosu', 'Sade Coker', 'Femi Lawal'];
  const sellFrac = { e1: .45, e2: .5, e3: .3, e4: .6, e5: .25, e6: .55, e7: .12, e8: .2, e9: .8 };
  st.events.forEach(ev => {
    if (!sellFrac[ev.id]) return;
    ev.tiers.forEach(t => {
      let target = Math.floor(t.qty * sellFrac[ev.id] * (0.7 + rnd() * .6));
      if (ev.id === 'e6' && t.id === 't2') target = 4; // low stock demo
      if (ev.id === 'e4' && t.id === 't2') target = 15; // sold out demo
      while (target > 0) {
        const q = Math.min(target, 1 + Math.floor(rnd() * 3));
        target -= q;
        const nm = names[Math.floor(rnd() * names.length)];
        const email = nm.toLowerCase().replace(/[^a-z]/g, '.') + Math.floor(rnd() * 90 + 10) + '@example.com';
        const fee = ev.absorbFee ? 0 : Math.round(t.price * st.settings.feePct / 100);
        const sub = t.price * q, f = fee * q;
        const ord = { id: uid('o'), ref: 'VV' + secureCode(10), eventId: ev.id, name: nm, email, phone: '+23480' + Math.floor(rnd() * 90000000 + 10000000), items: [{ tierId: t.id, name: t.name, qty: q, price: t.price, fee }], subtotal: sub, fee: f, absorbed: ev.absorbFee ? Math.round(t.price * st.settings.feePct / 100) * q : 0, total: sub + f, status: 'paid', createdAt: at(-1 - Math.floor(rnd() * 12), 10), paidAt: 0 };
        ord.paidAt = ord.createdAt + 60000;
        st.orders.push(ord);
        for (let i = 0; i < q; i++) st.tickets.push({ code: secureCode(24), orderId: ord.id, eventId: ev.id, tierId: t.id, tierName: t.name, holder: nm, status: ev.id === 'e9' && rnd() < .85 ? 'used' : 'valid', usedAt: 0 });
      }
    });
  });
  st.tickets.forEach(t => { if (t.status === 'used') t.usedAt = at(-18, 22); });
  return st;
}

/* ---------- domain logic (SERVER in production) ---------- */
const host = id => S.hosts.find(x => x.id === id);
const evOf = id => S.events.find(x => x.id === id);
function purgeHolds() { const n = now(); const before = S.holds.length; S.holds = S.holds.filter(x => x.expires > n); if (before !== S.holds.length) save(); }
function sold(ev, tid) { return S.tickets.filter(t => t.eventId === ev.id && t.tierId === tid && t.status !== 'void').length; }
function held(ev, tid, exceptHold) { purgeHolds(); return S.holds.filter(x => x.eventId === ev.id && x.id !== exceptHold).reduce((a, x) => a + (x.items[tid] || 0), 0); }
function avail(ev, t, exceptHold) { return Math.max(0, t.qty - sold(ev, t.id) - held(ev, t.id, exceptHold)); }
function tierState(ev, t) {
  const n = now();
  if (t.saleStart && n < t.saleStart) return { k: 'soon', label: 'Opens ' + fmtDate(t.saleStart) };
  if (t.saleEnd && n > t.saleEnd) return { k: 'closed', label: 'Sale closed' };
  const a = avail(ev, t);
  if (a <= 0) return { k: 'sold', label: 'Sold out' };
  if (a <= 10) return { k: 'low', label: 'Only ' + a + ' left', a };
  return { k: 'ok', a };
}
function feeFor(ev, price) { if (ev.absorbFee) return 0; return Math.max(S.settings.minFee || 0, Math.round(price * S.settings.feePct / 100)); }
function platformFee(price) { return Math.max(S.settings.minFee || 0, Math.round(price * S.settings.feePct / 100)); }
function fromPrice(ev) { const p = ev.tiers.filter(t => tierState(ev, t).k !== 'closed').map(t => t.price); return p.length ? Math.min.apply(null, p) : 0; }
function evSoldOut(ev) { return ev.tiers.every(t => ['sold', 'closed'].includes(tierState(ev, t).k)); }
function isPast(ev) { return ev.date < now() - 6 * 3600000; }
function paystackCharge(total) { return Math.min(2000, total * 0.015 + (total >= 2500 ? 100 : 0)); }

function createHold(eventId, cart) {
  const ev = evOf(eventId);
  for (const tid in cart) { const t = ev.tiers.find(x => x.id === tid); if (!t) return null; if (cart[tid] > avail(ev, t)) return null; }
  const hold = { id: uid('hold'), eventId, items: Object.assign({}, cart), expires: now() + S.settings.holdMinutes * 60000 };
  S.holds.push(hold); save(); return hold;
}
function releaseHold(id) { S.holds = S.holds.filter(x => x.id !== id); save(); }

// SERVER: called by the Paystack webhook. Idempotent. Checks reference, amount and status before issuing tickets.
function confirmPayment(ref, paidAmount) {
  const o = S.orders.find(x => x.ref === ref);
  if (!o) return { ok: false, why: 'Unknown reference' };
  if (o.status === 'paid') return { ok: true, duplicate: true, tickets: S.tickets.filter(t => t.orderId === o.id).length };
  if (paidAmount !== o.total * 100 && paidAmount !== o.total) return { ok: false, why: 'Amount mismatch' };
  o.status = 'paid'; o.paidAt = now();
  if (o.holdId) releaseHold(o.holdId);
  o.items.forEach(it => { for (let i = 0; i < it.qty; i++) S.tickets.push({ code: secureCode(24), orderId: o.id, eventId: o.eventId, tierId: it.tierId, tierName: it.name, holder: o.name, status: 'valid', usedAt: 0 }); });
  save();
  return { ok: true, duplicate: false, tickets: S.tickets.filter(t => t.orderId === o.id).length };
}
function refundOrder(orderId) {
  const o = S.orders.find(x => x.id === orderId); if (!o || o.status !== 'paid') return;
  o.status = 'refunded'; S.tickets.filter(t => t.orderId === o.id).forEach(t => { t.status = 'void'; });
  save();
}
// SERVER: door scan. Marks used and rejects second scan.
function scanTicket(code, eventId) {
  code = String(code || '').trim().toUpperCase();
  const t = S.tickets.find(x => x.code === code);
  if (!t || t.eventId !== eventId) return { ok: false, title: 'INVALID', sub: t ? 'Ticket is for a different event' : 'Code not recognised' };
  if (t.status === 'void') return { ok: false, title: 'REFUNDED', sub: 'This ticket was cancelled' };
  if (t.status === 'used') return { ok: false, title: 'ALREADY USED', sub: 'Scanned at ' + fmtTime(t.usedAt) };
  t.status = 'used'; t.usedAt = now(); save();
  return { ok: true, title: 'VALID', sub: t.tierName + ' · ' + t.holder };
}

/* ---------- QR ---------- */
function qrObj(code) { const q = qrcode(0, 'M'); q.addData(code); q.make(); return q; }
function qrSvg(code) { return qrObj(code).createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
function downloadTicketPng(t) {
  const ev = evOf(t.eventId), q = qrObj(t.code), n = q.getModuleCount();
  const c = document.createElement('canvas'); c.width = 720; c.height = 1040; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 720, 1040);
  x.fillStyle = '#E5122B'; x.fillRect(0, 0, 720, 14);
  x.fillStyle = '#fff'; x.font = '800 22px Montserrat, Arial'; x.fillText('VIBEVAULT', 40, 70);
  x.font = '800 44px Montserrat, Arial'; wrap(x, ev.title.toUpperCase(), 40, 150, 640, 52);
  x.fillStyle = '#9A9A9A'; x.font = '600 22px Montserrat, Arial';
  x.fillText(fmtDate(ev.date, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + fmtTime(ev.date), 40, 330);
  x.fillText(ev.venue, 40, 366);
  x.fillStyle = '#FF4D5F'; x.font = '800 26px Montserrat, Arial'; x.fillText(t.tierName + ' · ' + t.holder, 40, 420);
  x.fillStyle = '#fff'; x.fillRect(110, 470, 500, 500);
  const cell = 460 / n; x.fillStyle = '#000';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect(130 + k * cell, 490 + r * cell, Math.ceil(cell), Math.ceil(cell));
  x.fillStyle = '#9A9A9A'; x.font = '14px monospace'; x.fillText(t.code, 110, 1005);
  const a = document.createElement('a'); a.download = 'vibevault-ticket-' + t.code.slice(0, 6) + '.png'; a.href = c.toDataURL('image/png'); a.click();
}
function wrap(x, text, px, py, maxW, lh) { const words = text.split(' '); let line = ''; words.forEach(w => { const test = line + w + ' '; if (x.measureText(test).width > maxW && line) { x.fillText(line, px, py); line = w + ' '; py += lh; } else line = test; }); x.fillText(line, px, py); }
function downloadIcs(ev) {
  const f = ts => new Date(ts).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VIBEVAULT//EN', 'BEGIN:VEVENT', 'UID:' + ev.id + '@vibevault', 'DTSTAMP:' + f(now()), 'DTSTART:' + f(ev.date), 'DTEND:' + f(ev.date + 5 * 3600000), 'SUMMARY:' + ev.title, 'LOCATION:' + ev.venue, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.download = ev.title.replace(/\W+/g, '-') + '.ics'; a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.click();
}
function downloadCsv(name, rows) {
  const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const a = document.createElement('a'); a.download = name; a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.click();
}

/* ---------- ui parts ---------- */
const CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 21 L12 3 L22 21 L17.2 21 L12 11.6 L6.8 21 Z" fill="#E5122B"/></svg>';
const logo = (cls) => '<span class="logo ' + (cls || '') + '" role="img" aria-label="VIBEVAULT">VIBEV' + CHEV + 'ULT</span>';

function posterStyle(ev) {
  if (ev.img) return 'background-image:url(' + ev.img + ')';
  const g = GRADS[(ev.grad || 0) % GRADS.length];
  return 'background:radial-gradient(120% 90% at 20% 0%,' + g[0] + ' 0%,' + g[1] + ' 70%)';
}
function priceLabel(ev) { const p = fromPrice(ev); return p ? 'From ' + naira(p) : 'Free'; }
function stockBadge(ev) {
  if (evSoldOut(ev)) return '<span class="sold">Sold out</span>';
  const low = ev.tiers.find(t => tierState(ev, t).k === 'low');
  return low ? '<span class="low">Selling fast</span>' : '';
}
function card(ev) {
  return '<a class="card" href="#/event/' + ev.id + '"><div class="poster" style="' + posterStyle(ev) + '">' +
    '<span class="tag">' + h(ev.category) + '</span>' + (ev.promoted ? '<span class="tag promo">Featured</span>' : '') + (ev.status !== 'live' ? '<span class="tag draft" style="top:44px">' + ev.status + '</span>' : '') +
    (ev.img ? '' : '<div class="pt">' + h(ev.title) + '</div>') + '<div class="ps">' + h(ev.city.toUpperCase()) + '</div></div>' +
    '<div class="body"><h3>' + h(ev.title) + '</h3><div class="meta">' + fmtDate(ev.date) + ' · ' + fmtTime(ev.date) + '</div><div class="meta">' + h(ev.venue) + '</div>' +
    '<div class="price"><b>' + priceLabel(ev) + '</b>' + stockBadge(ev) + '</div></div></a>';
}
function modal(html, dark) {
  closeModal();
  const o = document.createElement('div'); o.className = 'overlay'; o.id = 'ov';
  o.innerHTML = '<div class="modal ' + (dark ? 'dark' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
  o.addEventListener('click', e => { if (e.target === o && !o.dataset.lock) closeModal(); });
  document.body.appendChild(o); return o;
}
function closeModal() { const o = $('#ov'); if (o) o.remove(); }

function ticketCard(t, withActions) {
  const ev = evOf(t.eventId);
  const void_ = t.status === 'void';
  return '<div class="ticket ' + (void_ ? 'void' : '') + '"><div class="l"><span class="vtype">' + h(ev.category) + '</span><h3>' + h(ev.title) + '</h3>' +
    '<div class="meta">' + fmtDate(ev.date) + ' · ' + fmtTime(ev.date) + '</div><div class="meta">' + h(ev.venue) + '</div>' +
    '<p style="margin-top:10px"><b>' + h(t.tierName) + '</b> · ' + h(t.holder) + '</p>' +
    '<p style="margin-top:6px"><span class="pill ' + (t.status === 'valid' ? 'g' : t.status === 'used' ? 'o' : 'r') + '">' + (t.status === 'valid' ? 'Valid' : t.status === 'used' ? 'Used' : 'Refunded') + '</span></p>' +
    (withActions && !void_ ? '<div class="tk-actions"><button class="btn sm dark" data-act="dlpng" data-code="' + t.code + '">Download image</button><button class="btn sm dark" data-act="printtk" data-code="' + t.code + '">Save as PDF</button><button class="btn sm dark" data-act="ics" data-ev="' + ev.id + '">Add to calendar</button></div>' : '') +
    '</div><div class="r">' + (void_ ? '<div style="font-weight:800">VOID</div>' : qrSvg(t.code)) + '<div class="code">' + t.code + '</div></div></div>';
}

/* ---------- pages ---------- */
const pages = {};

pages.home = function () {
  const live = S.events.filter(e => e.status === 'live' && !isPast(e)).sort((a, b) => a.date - b.date);
  const featured = live.filter(e => e.promoted);
  return '<section class="hero"><div class="wrap">' +
    '<span class="script" style="font-size:26px">Same People. New Vibes.</span>' +
    '<h1>Find the night.<br>Get the ticket.<br>Walk right in.</h1>' +
    '<p class="lead">Buy tickets to the best parties, raves and concerts in Nigeria. Pay with card, bank transfer or USSD. Your QR ticket lands in your inbox in under a minute.</p>' +
    '<div class="cta"><a class="btn" href="#/explore">Explore Events</a><a class="btn ghost" href="#/host-info">Host an Event</a></div>' +
    '<div class="badges"><span class="badge"><b>✔</b> Secure checkout with Paystack</span><span class="badge"><b>⚡</b> Instant QR tickets</span><span class="badge"><b>%</b> Only ' + S.settings.feePct + '% service fee</span></div>' +
    '</div></section>' +
    '<div class="wrap"><form class="search" id="homeSearch" role="search">' +
    '<input id="q" placeholder="Search events, venues, hosts" aria-label="Search">' +
    '<select id="fcity" aria-label="City"><option value="">All cities</option>' + CITIES.map(c => '<option>' + c.n + '</option>').join('') + '</select>' +
    '<select id="fcat" aria-label="Type"><option value="">All types</option>' + CATEGORIES.map(c => '<option>' + c.n + '</option>').join('') + '</select>' +
    '<select id="fprice" aria-label="Price"><option value="">Any price</option><option value="u3">Under ₦3,000</option><option value="m">₦3,000 to ₦8,000</option><option value="o">Over ₦8,000</option></select>' +
    '<button class="btn" type="submit">Search</button></form></div>' +
    (featured.length ? '<section class="block"><div class="wrap"><div class="sh"><h2>Featured <span class="script">tonight\'s heat</span></h2></div><div class="grid">' + featured.map(card).join('') + '</div></div></section>' : '') +
    '<section class="block" style="padding-top:10px"><div class="wrap"><div class="sh"><h2>Upcoming events</h2><a href="#/explore">See all</a></div>' +
    '<div class="chips" style="margin-bottom:18px">' + ['All'].concat(CATEGORIES.map(c => c.n)).map((c, i) => '<button class="chip ' + (i === 0 ? 'on' : '') + '" data-act="homecat" data-cat="' + (i ? c : '') + '">' + c + '</button>').join('') + '</div>' +
    '<div class="grid" id="homeGrid">' + live.slice(0, 8).map(card).join('') + '</div></div></section>' +
    '<section class="block"><div class="wrap"><div class="sh"><h2>Browse by vibe</h2></div><div class="cats">' + CATEGORIES.map(c => '<a class="cat" href="#/explore?cat=' + c.n + '"><span>' + c.i + '</span>' + c.n + '</a>').join('') + '</div></div></section>' +
    '<section class="block"><div class="wrap"><div class="sh"><h2>How it works</h2></div><div class="steps">' +
    '<div class="step"><b>01</b><h3>Pick your night</h3><p class="meta">Choose an event and the ticket that suits you.</p></div>' +
    '<div class="step"><b>02</b><h3>Pay securely</h3><p class="meta">Card, bank transfer or USSD through Paystack.</p></div>' +
    '<div class="step"><b>03</b><h3>Get your QR</h3><p class="meta">Tickets arrive by email and live on My Tickets.</p></div>' +
    '<div class="step"><b>04</b><h3>Walk in</h3><p class="meta">Staff scan your code once. Green means go.</p></div></div></div></section>' +
    '<section class="block"><div class="wrap"><div class="promo-band"><div><h2 style="font-size:28px">Throwing a party? <span class="script">Sell it here.</span></h2><p class="meta" style="max-width:520px;margin-top:6px">Create your event in minutes, track sales live, scan guests in with any phone and get paid fast after the night.</p></div><a class="btn" href="#/host-info">Start hosting</a></div></div></section>' +
    '<section class="block"><div class="wrap"><div class="sh"><h2>Find events by city</h2></div><div class="cities">' + CITIES.map(c => '<a class="citycard" href="#/city/' + c.n + '">' + c.n + '<small>' + c.s + ' · ' + live.filter(e => e.city === c.n).length + ' events</small></a>').join('') + '</div></div></section>' +
    '<section class="block"><div class="wrap"><div class="promo-band" style="flex-direction:column;text-align:center;align-items:center"><h2 style="font-size:clamp(24px,4vw,34px)">Ready for the next <span class="script">big night?</span></h2><div class="row-actions"><a class="btn" href="#/explore">Explore Events</a><a class="btn ghost" href="#/host-info">Host an Event</a></div><div class="badges" style="justify-content:center"><span class="badge"><b>✔</b> Secure checkout</span><span class="badge"><b>⚡</b> Instant QR tickets</span><span class="badge"><b>📍</b> Events across Nigeria</span></div></div></div></section>' +
    '<section class="block"><div class="wrap narrow" style="max-width:760px"><div class="sh"><h2>Quick answers</h2><a href="#/faq">All FAQs</a></div>' + faqHtml(4) + '</div></section>';
};

pages.explore = function (q) {
  const cat = q.cat || '', city = q.city || '', text = (q.q || '').toLowerCase(), pr = q.price || '';
  let list = S.events.filter(e => e.status === 'live' && !isPast(e));
  if (cat) list = list.filter(e => e.category === cat);
  if (city) list = list.filter(e => e.city === city);
  if (text) list = list.filter(e => (e.title + e.venue + (host(e.hostId) || {}).name).toLowerCase().includes(text));
  if (pr) list = list.filter(e => { const p = fromPrice(e); return pr === 'u3' ? p < 3000 : pr === 'm' ? p >= 3000 && p <= 8000 : p > 8000; });
  list.sort((a, b) => (b.promoted - a.promoted) || (a.date - b.date));
  return '<div class="page"><div class="wrap"><h1>Explore events</h1><p class="sub">' + list.length + ' event' + (list.length === 1 ? '' : 's') + ' found</p>' +
    '<div class="chips" style="margin-bottom:12px">' + ['All cities'].concat(CITIES.map(c => c.n)).map((c, i) => '<a class="chip ' + ((i === 0 && !city) || c === city ? 'on' : '') + '" href="#/explore?' + qs({ cat, city: i ? c : '', q: q.q, price: pr }) + '">' + c + '</a>').join('') + '</div>' +
    '<div class="chips" style="margin-bottom:22px">' + ['All types'].concat(CATEGORIES.map(c => c.n)).map((c, i) => '<a class="chip ' + ((i === 0 && !cat) || c === cat ? 'on' : '') + '" href="#/explore?' + qs({ cat: i ? c : '', city, q: q.q, price: pr }) + '">' + c + '</a>').join('') + '</div>' +
    (list.length ? '<div class="grid">' + list.map(card).join('') + '</div>' : '<div class="empty">No events match. Try a different city or type.</div>') + '</div></div>';
};
function qs(o) { return Object.keys(o).filter(k => o[k]).map(k => k + '=' + encodeURIComponent(o[k])).join('&'); }

pages.city = function (name) {
  const c = CITIES.find(x => x.n === name) || CITIES[0];
  const list = S.events.filter(e => e.status === 'live' && !isPast(e) && e.city === c.n).sort((a, b) => a.date - b.date);
  return '<div class="page"><div class="wrap"><h1>Events in ' + h(c.n) + '</h1><p class="sub">' + h(c.s) + '</p>' + (list.length ? '<div class="grid">' + list.map(card).join('') + '</div>' : '<div class="empty">No events yet in this city. Check back soon.</div>') +
    '<div class="chips" style="margin-top:30px">' + CITIES.map(x => '<a class="chip ' + (x.n === c.n ? 'on' : '') + '" href="#/city/' + x.n + '">' + x.n + '</a>').join('') + '</div></div></div>';
};

const cart = {}; // cart[eventId] = {tierId: qty}
function cartTotal(ev) { const c = cart[ev.id] || {}; return Object.values(c).reduce((a, b) => a + b, 0); }
function buyPanel(ev) {
  const c = cart[ev.id] || {}; let sub = 0, fee = 0, n = 0;
  const rows = ev.tiers.map(t => {
    const s = tierState(ev, t), q = c[t.id] || 0, f = feeFor(ev, t.price);
    sub += q * t.price; fee += q * f; n += q;
    const can = s.k === 'ok' || s.k === 'low';
    const maxQ = Math.min(t.max || 4, avail(ev, t));
    return '<div class="tier ' + (q ? 'sel' : '') + '"><div class="tier-top"><div><div class="tier-name">' + h(t.name) + '</div>' +
      (t.gender !== 'any' ? '<div class="tier-fee">' + (t.gender === 'female' ? 'Female guests only' : 'Male guests only') + '</div>' : '') +
      '<div class="tier-fee">' + (ev.absorbFee ? 'No service fee. Host covers it' : '+ ' + naira(f) + ' service fee') + '</div>' +
      (s.k === 'low' ? '<div class="low">' + s.label + '</div>' : '') + (!can ? '<div class="sold">' + s.label + '</div>' : '') +
      '</div><div class="tier-price">' + naira(t.price) + '</div></div>' +
      (can ? '<div class="qty" role="group" aria-label="Quantity for ' + h(t.name) + '"><button data-act="qty" data-t="' + t.id + '" data-d="-1" ' + (q ? '' : 'disabled') + ' aria-label="Less">−</button><span>' + q + '</span><button data-act="qty" data-t="' + t.id + '" data-d="1" ' + (q >= maxQ || n >= 4 ? 'disabled' : '') + ' aria-label="More">+</button></div>' : '') + '</div>';
  }).join('');
  const dis = !n || isPast(ev);
  return rows + '<div class="sum"><div class="row"><span>Tickets (' + n + ')</span><span>' + naira(sub) + '</span></div><div class="row"><span>Service fee</span><span>' + naira(fee) + '</span></div><div class="row total"><span>Total</span><span>' + naira(sub + fee) + '</span></div></div>' +
    '<button class="btn block" style="margin-top:14px" data-act="checkout" ' + (dis ? 'disabled' : '') + '>' + (isPast(ev) ? 'Event ended' : n ? 'Checkout ' + naira(sub + fee) : 'Select a ticket') + '</button>' +
    '<p class="meta" style="margin-top:10px;font-size:12px">Maximum 4 tickets per order. Stock is held for ' + S.settings.holdMinutes + ' minutes once you start checkout.</p>';
}
pages.event = function (id) {
  const ev = evOf(id); if (!ev) return notFound();
  const ho = host(ev.hostId), related = S.events.filter(e => e.id !== ev.id && e.status === 'live' && !isPast(e) && (e.city === ev.city || e.category === ev.category)).slice(0, 4);
  const saved = S.saved.includes(ev.id);
  const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ev.venue);
  return '<div class="wrap"><div class="crumb"><a href="#/">Home</a> / <a href="#/city/' + ev.city + '">' + ev.city + '</a> / ' + h(ev.title) + '</div>' +
    (ev.status !== 'live' ? '<div class="notice">This event is ' + ev.status + ' and not visible to the public.</div>' : '') +
    '<div class="ev-grid"><div>' +
    '<div class="poster wide" style="' + posterStyle(ev) + ';border-radius:18px"><span class="tag">' + h(ev.category) + '</span>' + (ev.promoted ? '<span class="tag promo">Featured</span>' : '') + (ev.img ? '' : '<div class="pt" style="font-size:clamp(28px,6vw,52px)">' + h(ev.title) + '</div>') + '<div class="ps">' + priceLabel(ev).toUpperCase() + '</div></div>' +
    '<h1 class="ev-title">' + h(ev.title) + '</h1>' +
    '<div class="chips"><button class="chip" data-act="copylink">Copy link</button><button class="chip ' + (saved ? 'on' : '') + '" data-act="save" data-ev="' + ev.id + '">' + (saved ? '♥ Saved' : '♡ Save') + '</button><button class="chip" data-act="share">Share</button></div>' +
    '<div class="tabs"><a href="#" data-act="jump" data-to="ov">Overview</a><a href="#" data-act="jump" data-to="loc">Location</a><a href="#" data-act="jump" data-to="hst">Host</a><a href="#" data-act="jump" data-to="tix">Tickets</a></div>' +
    '<div id="ov" class="panel"><h3>Overview</h3><div class="info"><div><i>📅</i><span><b>' + fmtDate(ev.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</b><small>' + fmtTime(ev.date) + '</small></span></div><div><i>📍</i><span><b>' + h(ev.venue) + '</b><small>' + h(ev.city) + '</small></span></div></div><p style="color:#ccc">' + h(ev.desc) + '</p></div>' +
    '<div id="loc" class="panel" style="margin-top:16px"><h3>Location</h3><p>' + h(ev.venue) + '</p><a class="btn sm dark" style="margin-top:12px" target="_blank" rel="noopener" href="' + maps + '">Open in Google Maps</a></div>' +
    '<div id="hst" class="panel" style="margin-top:16px"><h3>Host</h3><div class="hostbox"><div class="avatar">' + h(ho.name[0]) + '</div><div><b>' + h(ho.name) + '</b><div class="meta">' + h(ho.about) + '</div><div class="meta" style="margin-top:4px">' + h(ho.phone) + ' · ' + h(ho.email) + '</div></div></div></div>' +
    '</div><aside><div class="panel sticky" id="tix"><h3>Tickets <span class="meta" style="font-weight:500;font-size:13px">' + priceLabel(ev) + '</span></h3><div id="buy">' + buyPanel(ev) + '</div></div></aside></div>' +
    (related.length ? '<div class="related"><div class="sh"><h2>Related events</h2></div><div class="grid">' + related.map(card).join('') + '</div></div>' : '') +
    '<div class="panel" style="margin-top:30px;display:flex;gap:16px;justify-content:space-between;align-items:center;flex-wrap:wrap"><div><b>Need help with this event?</b><div class="meta">Chat to us on WhatsApp or read the FAQ.</div></div><div class="row-actions"><a class="btn sm dark" target="_blank" rel="noopener" href="https://wa.me/' + WHATSAPP + '">WhatsApp help</a><a class="btn sm dark" href="#/faq">FAQ</a></div></div></div>';
};

pages.checkout = function (id) {
  const ev = evOf(id); if (!ev) return notFound();
  const c = cart[id] || {}; const items = ev.tiers.filter(t => c[t.id]);
  if (!items.length) return '<div class="page"><div class="wrap narrow"><h1>Your cart is empty</h1><p class="sub">Pick your tickets first.</p><a class="btn" href="#/event/' + id + '">Back to event</a></div></div>';
  if (!checkoutHold || checkoutHold.eventId !== id || checkoutHold.expires < now()) {
    if (checkoutHold) releaseHold(checkoutHold.id);
    checkoutHold = createHold(id, c);
    if (!checkoutHold) return '<div class="page"><div class="wrap narrow"><h1>Sorry, someone just took those</h1><p class="sub">The tickets you picked are no longer available. Choose again.</p><a class="btn" href="#/event/' + id + '">Back to event</a></div></div>';
  }
  let sub = 0, fee = 0;
  const lines = items.map(t => { const f = feeFor(ev, t.price); sub += t.price * c[t.id]; fee += f * c[t.id]; return '<div class="row"><span>' + c[t.id] + ' × ' + h(t.name) + '</span><span>' + naira(t.price * c[t.id]) + '</span></div>'; }).join('');
  return '<div class="page"><div class="wrap"><div class="crumb"><a href="#/event/' + id + '">← Back to ' + h(ev.title) + '</a></div><h1>Checkout</h1><p class="sub">Tickets are sent to your email. No account needed.</p>' +
    '<div class="ev-grid"><div class="panel"><div class="hold"><span>Your tickets are held</span><span id="holdTimer">--:--</span></div>' +
    '<form id="coForm" novalidate><div class="field"><label for="cname">Full name</label><input id="cname" autocomplete="name" required></div>' +
    '<div class="field"><label for="cemail">Email for delivery</label><input id="cemail" type="email" autocomplete="email" required placeholder="you@email.com"><small>Your QR tickets are sent here.</small></div>' +
    '<div class="field"><label for="cphone">Phone number</label><input id="cphone" type="tel" autocomplete="tel" value="+234" required></div>' +
    '<button class="btn block" type="submit">Pay ' + naira(sub + fee) + ' with Paystack</button><p class="meta" style="margin-top:10px;font-size:12px">Card, bank transfer and USSD supported. By paying you accept the <a href="#/terms" style="text-decoration:underline">Terms</a> and <a href="#/refunds" style="text-decoration:underline">Refund policy</a>.</p></form></div>' +
    '<aside><div class="panel"><h3>Order summary</h3><div class="meta" style="margin-bottom:8px">' + h(ev.title) + ' · ' + fmtDate(ev.date) + '</div><div class="sum" style="border:0;margin:0;padding:0">' + lines + '<div class="row"><span>Service fee' + (ev.absorbFee ? ' (covered by host)' : ' (' + S.settings.feePct + '%)') + '</span><span>' + naira(fee) + '</span></div><div class="row total"><span>Total</span><span>' + naira(sub + fee) + '</span></div></div></div></aside></div></div></div>';
};
let checkoutHold = null, holdInt = null;

function paystackModal(order) {
  const o = modal('<div style="display:flex;justify-content:space-between;align-items:center"><div><h3>Paystack</h3><div style="color:#666;font-size:13px">' + h(order.email) + '</div></div><div style="font-weight:800;font-size:20px">' + naira(order.total) + '</div></div>' +
    '<div class="notice" style="margin-top:12px">Prototype only. No real money moves. In production this window is the real Paystack checkout.</div>' +
    '<div class="pm"><button class="on" data-act="pm">Card</button><button data-act="pm">Bank transfer</button><button data-act="pm">USSD</button></div>' +
    '<div id="pmBody"><input class="pay-in" placeholder="Card number" value="4084 0840 8408 4081" readonly><div style="display:flex;gap:8px"><input class="pay-in" placeholder="MM / YY" value="12 / 30" readonly><input class="pay-in" placeholder="CVV" value="408" readonly></div></div>' +
    '<button class="paybtn" data-act="paysuccess" data-ref="' + order.ref + '">Pay ' + naira(order.total) + '</button><button class="paybtn fail" data-act="payfail" data-ref="' + order.ref + '">Simulate a failed payment</button>');
  o.dataset.lock = '1';
}

pages.success = function (oid) {
  const o = S.orders.find(x => x.id === oid); if (!o) return notFound();
  const ev = evOf(o.eventId), tk = S.tickets.filter(t => t.orderId === o.id);
  if (o.status !== 'paid') return '<div class="page"><div class="wrap narrow"><h1>Waiting for confirmation</h1><p class="sub">We only issue tickets after Paystack confirms the payment to our server. If you paid, this updates shortly.</p><a class="btn" href="#/success/' + oid + '">Check again</a></div></div>';
  return '<div class="page"><div class="wrap"><div class="notice ok"><b>Payment confirmed.</b> ' + tk.length + ' ticket' + (tk.length > 1 ? 's' : '') + ' for ' + h(ev.title) + ' sent to ' + h(o.email) + '. Reference ' + h(o.ref) + '.</div>' +
    '<h1>You\'re in. <span class="script">See you there.</span></h1><p class="sub">Show the QR code at the door. Each code works once.</p><div class="printable">' + tk.map(t => ticketCard(t, true)).join('') + '</div>' +
    '<div class="row-actions" style="flex-wrap:wrap"><button class="btn dark" data-act="emailprev" data-oid="' + o.id + '">Preview the email we sent</button><a class="btn dark" href="#/tickets">My Tickets</a><a class="btn ghost" href="#/">Back to events</a></div>' +
    '<div class="panel" style="margin-top:24px"><b>Developer demo</b><p class="meta" style="margin:6px 0 12px">Paystack may send the same webhook twice. The server must never create duplicate tickets.</p><button class="btn sm dark" data-act="dupwebhook" data-ref="' + o.ref + '">Simulate duplicate webhook</button></div></div></div>';
};
pages.failed = function (oid) {
  const o = S.orders.find(x => x.id === oid); if (!o) return notFound();
  return '<div class="page"><div class="wrap narrow"><div class="notice"><b>Payment failed.</b> You were not charged.</div><h1>That did not go through</h1><p class="sub">Your card or bank may have declined it. You can try again with the same or another method.</p><a class="btn" href="#/checkout/' + o.eventId + '">Try again</a> <a class="btn ghost" href="#/event/' + o.eventId + '">Back to event</a></div></div>';
};

let tkSession = null;
pages.tickets = function (mode) {
  const rec = mode === 'recover';
  if (tkSession) {
    const tk = S.tickets.filter(t => S.orders.find(o => o.id === t.orderId && o.email.toLowerCase() === tkSession));
    return '<div class="page"><div class="wrap"><h1>My Tickets</h1><p class="sub">' + h(tkSession) + ' · <a href="#" data-act="tkout" style="text-decoration:underline">Use another email</a></p>' +
      (tk.length ? '<div class="printable">' + tk.sort((a, b) => evOf(a.eventId).date - evOf(b.eventId).date).map(t => ticketCard(t, true)).join('') + '</div>' : '<div class="empty">No tickets found for this email.</div>') + '</div></div>';
  }
  const sample = S.orders.find(o => o.status === 'paid');
  return '<div class="page"><div class="wrap narrow"><h1>' + (rec ? 'Recover your tickets' : 'My Tickets') + '</h1><p class="sub">' + (rec ? 'Lost the email? Enter the address you used at checkout and we will send your tickets again.' : 'Enter the email you used at checkout. No account needed.') + '</p>' +
    '<form id="tkForm" class="panel"><div class="field"><label for="tkemail">Email</label><input id="tkemail" type="email" required placeholder="you@email.com"></div><div id="tkCodeBox" class="hide"><div class="field"><label for="tkcode">One time code</label><input id="tkcode" inputmode="numeric" maxlength="6" placeholder="6 digit code"><small>Prototype code: <b>123456</b>. In production this code is emailed.</small></div></div><button class="btn block" type="submit" id="tkBtn">Send me my tickets</button></form>' +
    (sample ? '<p class="meta" style="margin-top:14px;font-size:12px">Demo tip: try <b>' + h(sample.email) + '</b> or buy a ticket yourself.</p>' : '') + '</div></div>';
};

/* --- door scanner --- */
let scan = { eventId: null, offline: false, last: null, stream: null, timer: null, lastCode: '', lastAt: 0 };
pages.scan = function () {
  if (!scan.eventId) {
    const live = S.events.filter(e => e.status === 'live');
    return '<div class="page"><div class="wrap narrow"><h1>Door check in</h1><p class="sub">Pick your event and enter the PIN from the host.</p><form id="scanLogin" class="panel">' +
      '<div class="field"><label for="sev">Event</label><select id="sev">' + live.map(e => '<option value="' + e.id + '">' + h(e.title) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="spin">Event PIN</label><input id="spin" inputmode="numeric" maxlength="4" placeholder="4 digit PIN"><small>Prototype: Vault Opening Night PIN is <b>4821</b>. Hosts see their PIN on the dashboard.</small></div>' +
      '<button class="btn block" type="submit">Open scanner</button></form></div></div>';
  }
  const ev = evOf(scan.eventId), tk = S.tickets.filter(t => t.eventId === ev.id && t.status !== 'void');
  const used = tk.filter(t => t.status === 'used').length;
  const r = scan.last;
  return '<div class="page"><div class="wrap scanbox"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px"><div><h1 style="font-size:24px;margin:0">' + h(ev.title) + '</h1><div class="meta">' + fmtDate(ev.date) + '</div></div><button class="btn sm dark" data-act="scanexit">Exit</button></div>' +
    '<div class="count"><div><div class="meta"><span class="dot ' + (scan.offline ? 'off' : '') + '"></span>' + (scan.offline ? 'Offline. Scans are queued' : 'Online') + '</div><div class="meta">Queued: ' + S.scanQueue.length + '</div></div><div style="text-align:right"><b>' + used + '</b><span class="meta"> / ' + tk.length + '</span><div class="meta">checked in</div></div></div>' +
    (scan.offline ? '<div class="notice">You are offline. Valid looking scans are saved on this phone and sync when you reconnect.</div>' : '') +
    '<div class="viewfinder" id="vf"><video id="cam" playsinline muted class="hide"></video><div id="vfmsg">Camera is off<br><small>Tap Start camera, or type the code below.</small></div></div>' +
    '<div class="row-actions" style="margin-top:10px"><button class="btn dark block" data-act="camstart">Start camera</button><button class="btn dark block" data-act="offtoggle">' + (scan.offline ? 'Go online and sync' : 'Simulate offline') + '</button></div>' +
    '<form id="manual" style="display:flex;gap:8px;margin-top:12px"><input id="mcode" class="pay-in" style="margin:0;background:#000;color:#fff;border-color:#2c2c2c;text-transform:uppercase" placeholder="Enter ticket code" autocomplete="off"><button class="btn" type="submit">Check</button></form>' +
    '<div class="result ' + (r ? (r.ok ? 'ok' : r.queued ? '' : 'bad') : 'idle') + '" style="' + (r && r.queued ? 'background:var(--ember);color:#000' : '') + '">' + (r ? h(r.title) + '<small>' + h(r.sub) + '</small>' : 'Waiting for a scan') + '</div>' +
    '<details class="panel" style="margin-top:16px"><summary style="cursor:pointer;font-weight:700">Demo: pick a sample ticket</summary><p class="meta" style="margin:8px 0">Tap a code to test the scanner without a camera.</p>' +
    tk.slice(0, 6).map(t => '<button class="btn sm dark" style="margin:3px 3px 3px 0" data-act="samplescan" data-code="' + t.code + '">' + t.code.slice(0, 8) + '… ' + (t.status === 'used' ? '(used)' : '') + '</button>').join('') + '</details></div></div>';
};
function doScan(code) {
  const ev = scan.eventId; code = String(code || '').trim().toUpperCase(); if (!code) return;
  if (scan.offline) {
    const t = S.tickets.find(x => x.code === code && x.eventId === ev);
    if (!t) scan.last = { ok: false, title: 'INVALID', sub: 'Code not recognised' };
    else if (t.status === 'void') scan.last = { ok: false, title: 'REFUNDED', sub: 'This ticket was cancelled' };
    else if (t.status === 'used' || S.scanQueue.some(q => q.code === code)) scan.last = { ok: false, title: 'ALREADY USED', sub: 'Scanned earlier' };
    else { S.scanQueue.push({ code, at: now(), eventId: ev }); save(); scan.last = { ok: false, queued: true, title: 'SAVED OFFLINE', sub: t.tierName + ' · ' + t.holder + ' · will sync' }; }
  } else scan.last = scanTicket(code, ev);
  if (navigator.vibrate) navigator.vibrate(scan.last.ok ? 60 : [80, 60, 80]);
  rerender();
}
function syncQueue() {
  let ok = 0, bad = 0; S.scanQueue.forEach(q => { const r = scanTicket(q.code, q.eventId); r.ok ? ok++ : bad++; });
  S.scanQueue = []; save(); toast('Synced ' + ok + ' scan' + (ok === 1 ? '' : 's') + (bad ? ', ' + bad + ' rejected' : ''));
}
async function startCamera() {
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices) { toast('Camera scanning needs Chrome on Android. Use manual entry here.'); return; }
  try {
    scan.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const v = $('#cam'); v.srcObject = scan.stream; v.classList.remove('hide'); $('#vfmsg').classList.add('hide'); await v.play();
    const det = new BarcodeDetector({ formats: ['qr_code'] });
    scan.timer = setInterval(async () => {
      try { const res = await det.detect(v); if (res.length) { const c = res[0].rawValue; if (c !== scan.lastCode || now() - scan.lastAt > 2500) { scan.lastCode = c; scan.lastAt = now(); doScan(c); } } } catch (e) {}
    }, 350);
  } catch (e) { toast('Could not open the camera. Check permission.'); }
}
function stopCamera() { if (scan.timer) clearInterval(scan.timer); scan.timer = null; if (scan.stream) scan.stream.getTracks().forEach(t => t.stop()); scan.stream = null; }

/* --- host --- */
function curHost() { return S.session.role === 'host' ? host(S.session.hostId) : null; }
function needRole(role) {
  const r = S.session.role;
  if (role === 'host' && (r === 'host' || r === 'admin')) return null;
  if (role === 'admin' && r === 'admin') return null;
  return '<div class="page"><div class="wrap narrow"><h1>Sign in required</h1><p class="sub">This area is for ' + (role === 'admin' ? 'VIBEVAULT admins' : 'hosts') + '.</p><a class="btn" href="#/login">Go to sign in</a></div></div>';
}
function hostEvents() { const hh = curHost(); return S.events.filter(e => hh ? e.hostId === hh.id : true); }
let hostSel = null;
function eventStats(ev) {
  const orders = S.orders.filter(o => o.eventId === ev.id && o.status === 'paid');
  const tk = S.tickets.filter(t => t.eventId === ev.id && t.status !== 'void');
  const gross = orders.reduce((a, o) => a + o.subtotal, 0), absorbed = orders.reduce((a, o) => a + (o.absorbed || 0), 0);
  return { orders, tk, gross, net: gross - absorbed, used: tk.filter(t => t.status === 'used').length };
}
pages.host = function () {
  const g = needRole('host'); if (g) return g;
  const evs = hostEvents(), hh = curHost();
  if (!evs.length) return '<div class="page"><div class="wrap"><h1>Host dashboard</h1><p class="sub">Nothing here yet.</p><a class="btn" href="#/host/create">Create your first event</a></div></div>';
  if (!hostSel || !evs.find(e => e.id === hostSel)) hostSel = evs[0].id;
  const ev = evOf(hostSel), st = eventStats(ev), me = host(ev.hostId);
  const byTier = ev.tiers.map(t => { const n = S.tickets.filter(x => x.eventId === ev.id && x.tierId === t.id && x.status !== 'void').length; return { t, n, rev: n * t.price }; });
  const ended = isPast(ev);
  const payTxt = ev.payout === 'paid' ? '<span class="pill g">Paid</span>' : ev.payout === 'requested' ? '<span class="pill o">Requested</span>' : ended ? '<span class="pill o">Ready to request</span>' : '<span class="pill">After the event</span>';
  return '<div class="page"><div class="wrap">' + (hh && hh.status !== 'approved' ? '<div class="notice">Your host account is waiting for VIBEVAULT approval. You can build events but cannot publish yet.</div>' : '') +
    '<div class="sh"><div><h1 style="margin:0">Host dashboard</h1><p class="meta">' + (hh ? h(hh.name) : 'Viewing all hosts as admin') + '</p></div><a class="btn" href="#/host/create">+ Create event</a></div>' +
    '<div class="tabbar">' + evs.map(e => '<button class="chip ' + (e.id === hostSel ? 'on' : '') + '" data-act="hostsel" data-ev="' + e.id + '">' + h(e.title) + '</button>').join('') + '</div>' +
    '<div class="stats"><div class="stat"><small>Tickets sold</small><b>' + st.tk.length + '</b></div><div class="stat"><small>Revenue (host share)</small><b>' + naira(st.net) + '</b></div><div class="stat"><small>Orders</small><b>' + st.orders.length + '</b></div><div class="stat"><small>Checked in</small><b>' + st.used + '</b></div><div class="stat"><small>Status</small><b style="font-size:18px;text-transform:capitalize">' + ev.status + '</b></div></div>' +
    '<div class="ev-grid" style="grid-template-columns:1.3fr 1fr"><div><div class="sh"><h3>Sales by tier</h3></div><div class="tablewrap"><table><tr><th>Tier</th><th>Price</th><th>Sold</th><th>Progress</th><th>Revenue</th></tr>' + byTier.map(x => '<tr><td>' + h(x.t.name) + '</td><td>' + naira(x.t.price) + '</td><td>' + x.n + ' / ' + x.t.qty + '</td><td><div class="bar"><i style="width:' + Math.min(100, x.n / x.t.qty * 100) + '%"></i></div></td><td>' + naira(x.rev) + '</td></tr>').join('') + '</table></div></div>' +
    '<div class="panel"><h3>Event tools</h3><div class="info"><div><i>🔑</i><span><b>Door PIN ' + h(ev.doorPin) + '</b><small>Share with door staff. Scanner at <a href="#/scan" style="text-decoration:underline">/scan</a></small></span></div>' +
    '<div><i>💸</i><span><b>Payout ' + payTxt + '</b><small>' + (me.bank ? h(me.bank.bank) + ' · ' + h(me.bank.name) + (me.bank.verified ? ' (verified)' : '') : 'Add bank details to get paid') + '</small></span></div></div>' +
    '<div class="row-actions" style="flex-wrap:wrap"><a class="btn sm dark" href="#/host/edit/' + ev.id + '">Edit</a><a class="btn sm dark" href="#/event/' + ev.id + '">View page</a>' +
    (ended && ev.payout === 'none' ? '<button class="btn sm" data-act="reqpayout" data-ev="' + ev.id + '">Request payout</button>' : '') +
    (ev.status === 'live' && !ev.promoted && !ev.promoReq ? '<button class="btn sm dark" data-act="reqpromo" data-ev="' + ev.id + '">Promote on homepage (' + naira(S.settings.promoPrice) + ')</button>' : '') + (ev.promoReq && !ev.promoted ? '<span class="pill o">Promotion pending</span>' : '') + '</div>' +
    '<p class="meta" style="margin-top:12px;font-size:12px"><b>Fast payouts:</b> VIBEVAULT pays hosts within 24 hours of the event ending, minus refunds. (Prototype wording, confirm the real timing.)</p></div></div>' +
    '<div class="sh" style="margin-top:28px"><h3>Attendees</h3><button class="btn sm dark" data-act="exportcsv" data-ev="' + ev.id + '">Export CSV</button></div><div class="tablewrap"><table><tr><th>Name</th><th>Email</th><th>Phone</th><th>Tier</th><th>Status</th></tr>' +
    (st.tk.length ? st.tk.slice(0, 60).map(t => { const o = S.orders.find(x => x.id === t.orderId); return '<tr><td>' + h(t.holder) + '</td><td>' + h(o.email) + '</td><td>' + h(o.phone) + '</td><td>' + h(t.tierName) + '</td><td><span class="pill ' + (t.status === 'used' ? 'o' : 'g') + '">' + t.status + '</span></td></tr>'; }).join('') : '<tr><td colspan="5" class="empty">No attendees yet</td></tr>') + '</table></div>' +
    (st.tk.length > 60 ? '<p class="meta" style="margin-top:8px">Showing 60 of ' + st.tk.length + '. Export CSV for the full list.</p>' : '') +
    '<div class="panel" style="margin-top:28px"><h3>Bank details for payouts</h3>' + bankForm(me) + '</div></div></div>';
};
function bankForm(me) {
  return '<form id="bankForm" data-host="' + me.id + '"><div class="two"><div class="field"><label for="bbank">Bank</label><select id="bbank">' + ['Access Bank', 'GTBank', 'Zenith Bank', 'UBA', 'First Bank', 'Opay', 'Kuda', 'Moniepoint'].map(b => '<option ' + (me.bank && me.bank.bank === b ? 'selected' : '') + '>' + b + '</option>').join('') + '</select></div><div class="field"><label for="bacct">Account number</label><input id="bacct" inputmode="numeric" maxlength="10" value="' + h(me.bank ? me.bank.acct : '') + '"></div></div><button class="btn sm" type="submit">Verify and save</button><p class="meta" style="font-size:12px;margin-top:8px">Prototype: the account name is looked up and checked before the first payout.' + (me.bank && me.bank.verified ? ' Verified as <b>' + h(me.bank.name) + '</b>.' : '') + '</p></form>';
}

let draftTiers = [];
pages.create = function (id) {
  const g = needRole('host'); if (g) return g;
  const ev = id ? evOf(id) : null; const hh = curHost() || host('h1');
  if (!draftTiers.length || draftTiers.__for !== (id || 'new')) { draftTiers = (ev ? ev.tiers.map(t => Object.assign({}, t)) : [{ id: 't1', name: 'General', price: 3000, qty: 100, gender: 'any', saleStart: null, saleEnd: null, max: 4 }]); draftTiers.__for = id || 'new'; }
  const dt = ev ? new Date(ev.date - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
  return '<div class="page"><div class="wrap narrow" style="max-width:760px"><h1>' + (ev ? 'Edit event' : 'Create event') + '</h1><p class="sub">Hosting as ' + h(hh.name) + '</p><form id="evForm" data-id="' + (id || '') + '" class="panel">' +
    '<div class="field"><label for="etitle">Event title</label><input id="etitle" required value="' + h(ev ? ev.title : '') + '"></div>' +
    '<div class="two"><div class="field"><label for="ecat">Category</label><select id="ecat">' + CATEGORIES.map(c => '<option ' + (ev && ev.category === c.n ? 'selected' : '') + '>' + c.n + '</option>').join('') + '</select></div><div class="field"><label for="ecity">City</label><select id="ecity">' + CITIES.map(c => '<option ' + (ev && ev.city === c.n ? 'selected' : '') + '>' + c.n + '</option>').join('') + '</select></div></div>' +
    '<div class="field"><label for="edate">Date and time</label><input id="edate" type="datetime-local" required value="' + dt + '"></div>' +
    '<div class="field"><label for="evenue">Venue</label><input id="evenue" required value="' + h(ev ? ev.venue : '') + '"><small>Guests get an Open in Google Maps link built from this.</small></div>' +
    '<div class="field"><label for="eposter">Poster image</label><input id="eposter" type="file" accept="image/*"><small>Optional. Without one we generate a bold poster from the title.</small></div>' +
    '<div class="field"><label for="edesc">Description</label><textarea id="edesc">' + h(ev ? ev.desc : '') + '</textarea></div>' +
    '<h3 style="margin:18px 0 8px">Ticket tiers</h3><div id="tierList">' + tierRows() + '</div><button type="button" class="btn sm dark" data-act="addtier">+ Add tier</button>' +
    '<label style="display:flex;gap:10px;align-items:flex-start;margin:18px 0"><input type="checkbox" id="eabs" ' + (ev && ev.absorbFee ? 'checked' : '') + ' style="width:20px;height:20px;margin-top:2px"><span><b>I will cover the service fee</b><br><small class="meta">Buyers see the ticket price only. The ' + S.settings.feePct + '% fee is deducted from your payout instead.</small></span></label>' +
    '<div class="row-actions" style="flex-wrap:wrap"><button class="btn" type="submit" data-mode="publish">' + (hh.status === 'approved' || S.session.role === 'admin' ? (S.settings.approveEvents && S.session.role !== 'admin' ? 'Submit for approval' : 'Publish') : 'Submit for approval') + '</button><button class="btn dark" type="submit" data-mode="draft">Save as draft</button></div></form></div></div>';
};
function tierRows() {
  return draftTiers.map((t, i) => '<div class="panel" style="margin-bottom:10px;padding:14px"><div class="two"><div class="field"><label>Name</label><input data-tf="name" data-i="' + i + '" value="' + h(t.name) + '"></div><div class="field"><label>Price (₦)</label><input data-tf="price" data-i="' + i + '" type="number" min="0" value="' + t.price + '"></div></div>' +
    '<div class="two"><div class="field"><label>Quantity</label><input data-tf="qty" data-i="' + i + '" type="number" min="1" value="' + t.qty + '"></div><div class="field"><label>Open to</label><select data-tf="gender" data-i="' + i + '"><option value="any" ' + (t.gender === 'any' ? 'selected' : '') + '>Everyone</option><option value="female" ' + (t.gender === 'female' ? 'selected' : '') + '>Female only</option><option value="male" ' + (t.gender === 'male' ? 'selected' : '') + '>Male only</option></select></div></div>' +
    '<div class="two"><div class="field"><label>Sale opens</label><input data-tf="saleStart" data-i="' + i + '" type="datetime-local" value="' + (t.saleStart ? new Date(t.saleStart - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '') + '"></div><div class="field"><label>Sale closes</label><input data-tf="saleEnd" data-i="' + i + '" type="datetime-local" value="' + (t.saleEnd ? new Date(t.saleEnd - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '') + '"></div></div>' +
    (draftTiers.length > 1 ? '<button type="button" class="btn sm dark" data-act="rmtier" data-i="' + i + '">Remove tier</button>' : '') + '</div>').join('');
}

pages['host-info'] = function () {
  return '<div class="page"><div class="wrap" style="max-width:900px"><h1>Host an event on <span class="script">VIBEVAULT</span></h1><p class="sub">Everything you need to sell out your night.</p><div class="steps">' +
    '<div class="step"><b>LOW FEES</b><h3>' + S.settings.feePct + '% service fee</h3><p class="meta">Paid by the buyer. You receive the full ticket price, or choose to cover the fee yourself.</p></div>' +
    '<div class="step"><b>FAST PAYOUTS</b><h3>Paid within 24 hours</h3><p class="meta">Payouts go out after your event ends, minus any refunds. (Timing to be confirmed before launch.)</p></div>' +
    '<div class="step"><b>LIVE DASHBOARD</b><h3>Watch sales move</h3><p class="meta">Tickets sold, revenue by tier, attendee list and CSV export.</p></div>' +
    '<div class="step"><b>DOOR TOOLS</b><h3>Scan with any phone</h3><p class="meta">No app to install. Works with a weak signal and syncs when you are back online.</p></div>' +
    '<div class="step"><b>PROMOTION</b><h3>Get featured</h3><p class="meta">Pay to place your event on the homepage and reach more buyers.</p></div>' +
    '<div class="step"><b>TICKET RULES</b><h3>Gender based tiers</h3><p class="meta">Early Bird Female and Early Bird Male at different prices, with a four ticket limit per order.</p></div></div>' +
    '<div class="row-actions" style="margin-top:26px"><a class="btn" href="#/login?mode=signup">Become a host</a><a class="btn ghost" href="#/host-agreement">Read the host agreement</a></div></div></div>';
};

pages.login = function (q) {
  const signup = q.mode === 'signup';
  return '<div class="page"><div class="wrap narrow"><h1>' + (signup ? 'Become a host' : 'Host and admin sign in') + '</h1><p class="sub">Guests never need an account. Only hosts and VIBEVAULT staff sign in.</p>' +
    '<div class="notice">Prototype: no real passwords are checked. Use a demo account below or sign up to see the pending approval flow.</div>' +
    '<div class="panel" style="margin-bottom:16px"><h3>Demo accounts</h3><div class="row-actions" style="flex-wrap:wrap">' + S.hosts.filter(x => x.status === 'approved').map(x => '<button class="btn sm dark" data-act="loginas" data-id="' + x.id + '">Host: ' + h(x.name) + '</button>').join('') + '<button class="btn sm" data-act="loginadmin">VIBEVAULT admin</button></div></div>' +
    '<form id="signupForm" class="panel"><h3>New host sign up</h3><div class="field"><label for="shn">Host or business name</label><input id="shn" required></div><div class="field"><label for="she">Email</label><input id="she" type="email" required></div><div class="field"><label for="shp">Password</label><input id="shp" type="password" minlength="8" required><small>Prototype only. Not stored.</small></div><button class="btn block" type="submit">Create host account</button><p class="meta" style="font-size:12px;margin-top:8px">New hosts are approved by VIBEVAULT before they can publish. Email verification is sent in production.</p></form></div></div>';
};

/* --- admin --- */
let adminTab = 'overview';
pages.admin = function () {
  const g = needRole('admin'); if (g) return g;
  const paid = S.orders.filter(o => o.status === 'paid');
  const gross = paid.reduce((a, o) => a + o.total, 0), fees = paid.reduce((a, o) => a + o.fee + (o.absorbed || 0), 0), psk = paid.reduce((a, o) => a + paystackCharge(o.total), 0);
  const tabs = ['overview', 'hosts', 'events', 'orders', 'fees', 'flags'];
  let body = '';
  if (adminTab === 'overview') body = '<div class="stats"><div class="stat"><small>Gross sales</small><b>' + naira(gross) + '</b></div><div class="stat"><small>Service fees</small><b>' + naira(fees) + '</b></div><div class="stat"><small>Est. Paystack charges</small><b>' + naira(psk) + '</b></div><div class="stat"><small>Est. kept after Paystack</small><b>' + naira(fees - psk) + '</b></div><div class="stat"><small>Orders</small><b>' + paid.length + '</b></div><div class="stat"><small>Hosts pending</small><b>' + S.hosts.filter(x => x.status === 'pending').length + '</b></div></div><p class="meta">Estimates exclude VAT, hosting and payout transfer costs, as in the brief.</p>';
  if (adminTab === 'hosts') body = '<div class="tablewrap"><table><tr><th>Host</th><th>Email</th><th>Status</th><th>Bank</th><th></th></tr>' + S.hosts.map(x => '<tr><td>' + h(x.name) + '</td><td>' + h(x.email) + '</td><td><span class="pill ' + (x.status === 'approved' ? 'g' : x.status === 'pending' ? 'o' : 'r') + '">' + x.status + '</span></td><td>' + (x.bank ? (x.bank.verified ? 'Verified' : 'Unverified') : 'None') + '</td><td class="row-actions">' + (x.status !== 'approved' ? '<button class="btn sm" data-act="hoststatus" data-id="' + x.id + '" data-s="approved">Approve</button>' : '<button class="btn sm dark" data-act="hoststatus" data-id="' + x.id + '" data-s="suspended">Suspend</button>') + '</td></tr>').join('') + '</table></div>';
  if (adminTab === 'events') body = '<div class="tablewrap"><table><tr><th>Event</th><th>Host</th><th>Date</th><th>Status</th><th>Sold</th><th></th></tr>' + S.events.map(e => '<tr><td><a href="#/event/' + e.id + '" style="text-decoration:underline">' + h(e.title) + '</a></td><td>' + h(host(e.hostId).name) + '</td><td>' + fmtDate(e.date) + '</td><td><span class="pill ' + (e.status === 'live' ? 'g' : e.status === 'cancelled' ? 'r' : 'o') + '">' + e.status + '</span>' + (e.promoReq && !e.promoted ? ' <span class="pill o">promo request</span>' : '') + '</td><td>' + eventStats(e).tk.length + '</td><td class="row-actions">' +
    (e.status === 'pending' ? '<button class="btn sm" data-act="evstatus" data-id="' + e.id + '" data-s="live">Approve</button>' : '') + (e.status === 'live' ? '<button class="btn sm dark" data-act="togglepromo" data-id="' + e.id + '">' + (e.promoted ? 'Unfeature' : 'Feature') + '</button><button class="btn sm dark" data-act="cancelev" data-id="' + e.id + '">Cancel + refund</button>' : '') + (e.payout === 'requested' ? '<button class="btn sm" data-act="markpaid" data-id="' + e.id + '">Mark paid out</button>' : '') + '</td></tr>').join('') + '</table></div>';
  if (adminTab === 'orders') body = '<div class="tablewrap"><table><tr><th>Ref</th><th>Buyer</th><th>Event</th><th>Total</th><th>Fee</th><th>Status</th><th></th></tr>' + S.orders.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 50).map(o => '<tr><td>' + h(o.ref) + '</td><td>' + h(o.email) + '</td><td>' + h(evOf(o.eventId).title) + '</td><td>' + naira(o.total) + '</td><td>' + naira(o.fee + (o.absorbed || 0)) + '</td><td><span class="pill ' + (o.status === 'paid' ? 'g' : o.status === 'refunded' ? 'r' : 'o') + '">' + o.status + '</span></td><td>' + (o.status === 'paid' ? '<button class="btn sm dark" data-act="refund" data-id="' + o.id + '">Refund</button>' : '') + '</td></tr>').join('') + '</table></div><p class="meta" style="margin-top:8px">Showing latest 50 orders.</p>';
  if (adminTab === 'fees') body = '<div class="panel" style="max-width:520px"><h3>Fee settings</h3><form id="feeForm"><div class="field"><label for="fpct">Buyer service fee (%)</label><input id="fpct" type="number" step="0.5" min="0" max="20" value="' + S.settings.feePct + '"><small>Brief recommends 5% at launch. Stored as a setting, not hard coded.</small></div><div class="field"><label for="fmin">Minimum fee per ticket (₦)</label><input id="fmin" type="number" min="0" value="' + S.settings.minFee + '"><small>Open question in the brief.</small></div><div class="field"><label for="fhold">Stock hold (minutes)</label><input id="fhold" type="number" min="1" max="30" value="' + S.settings.holdMinutes + '"></div><label style="display:flex;gap:10px;margin-bottom:14px"><input type="checkbox" id="fappr" ' + (S.settings.approveEvents ? 'checked' : '') + ' style="width:20px;height:20px"><span>Approve every event before it goes live</span></label><button class="btn" type="submit">Save settings</button></form></div>' +
    '<div class="panel" style="max-width:720px;margin-top:16px"><h3>What VIBEVAULT keeps per ticket at ' + S.settings.feePct + '%</h3><div class="tablewrap"><table><tr><th>Ticket</th><th>Fee</th><th>Paystack est.</th><th>Kept</th></tr>' + [2000, 3000, 5000, 10000].map(p => { const f = platformFee(p), pc = paystackCharge(p + f); return '<tr><td>' + naira(p) + '</td><td>' + naira(f) + '</td><td>' + naira(pc) + '</td><td style="color:' + (f - pc < 0 ? 'var(--redtext)' : 'var(--green)') + '">' + (f - pc < 0 ? '−' : '') + naira(Math.abs(f - pc)) + '</td></tr>'; }).join('') + '</table></div></div>';
  if (adminTab === 'flags') { const multi = {}; S.orders.forEach(o => { multi[o.email] = (multi[o.email] || 0) + 1; }); const auto = Object.keys(multi).filter(k => multi[k] >= 3).map(k => ({ id: 'a' + k, note: k + ' has ' + multi[k] + ' orders', status: 'review' }));
    body = '<div class="tablewrap"><table><tr><th>Flag</th><th>Status</th><th></th></tr>' + S.flags.concat(auto).map(f => '<tr><td>' + h(f.note) + '</td><td><span class="pill o">' + f.status + '</span></td><td>' + (S.flags.find(x => x.id === f.id) ? '<button class="btn sm dark" data-act="clearflag" data-id="' + f.id + '">Dismiss</button>' : '') + '</td></tr>').join('') + '</table></div>'; }
  return '<div class="page"><div class="wrap"><h1>Admin</h1><p class="sub">Approvals, sales, refunds and fees.</p><div class="tabbar">' + tabs.map(t => '<button class="chip ' + (t === adminTab ? 'on' : '') + '" data-act="admintab" data-t="' + t + '" style="text-transform:capitalize">' + t + '</button>').join('') + '</div>' + body + '</div></div>';
};

/* --- content pages --- */
const FAQS = [
  ['How much is the service fee?', 'A flat ' + 'percent of the ticket price, shown in naira on every ticket before you pay. Right now it is {fee}%. Some hosts cover the fee themselves and then you only see the ticket price. There are no hidden extras at checkout.'],
  ['How do I get my ticket?', 'Right after Paystack confirms your payment, we email you a QR code for every ticket. They also appear on My Tickets.'],
  ['I lost my ticket email. What now?', 'Open Recover Tickets, enter the email you used at checkout and we send everything again.'],
  ['Which payment methods work?', 'Card, bank transfer and USSD through Paystack.'],
  ['Can I get a refund?', 'Refunds follow the event policy. If an event is cancelled, every buyer is refunded. See the Refund policy for details.'],
  ['Do I need an account?', 'No. Guests buy with an email and phone number only. Hosts sign up to create events.'],
  ['How do hosts get paid?', 'After the event ends, minus any refunds. Hosts add and verify a bank account first.']
];
function faqHtml(n) { return '<div class="faq">' + FAQS.slice(0, n || FAQS.length).map(f => '<details><summary>' + h(f[0]) + '</summary><p>' + h(f[1].replace('{fee}', S.settings.feePct).replace('A flat percent', 'A percentage')) + '</p></details>').join('') + '</div>'; }
pages.faq = () => '<div class="page"><div class="wrap narrow"><h1>Frequently asked questions</h1><p class="sub">Straight answers, including about fees.</p>' + faqHtml() + '<p style="margin-top:24px"><a class="btn" href="#/support">Contact support</a></p></div></div>';
pages.support = () => '<div class="page"><div class="wrap narrow"><h1>Support</h1><p class="sub">We reply fast, and faster on event day.</p><div class="row-actions" style="margin-bottom:20px;flex-wrap:wrap"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + WHATSAPP + '">Chat on WhatsApp</a><a class="btn dark" href="mailto:' + SUPPORT_EMAIL + '">' + SUPPORT_EMAIL + '</a><a class="btn dark" href="#/recover">Recover tickets</a></div><form id="supForm" class="panel"><div class="field"><label for="sn">Name</label><input id="sn" required></div><div class="field"><label for="se">Email</label><input id="se" type="email" required></div><div class="field"><label for="sm">How can we help?</label><textarea id="sm" required></textarea></div><button class="btn block" type="submit">Send message</button></form></div></div>';
const VENDORS = [
  ['DJ Kontrol', 'DJ', 'Lagos', 'Afrobeats, amapiano and open format sets.'], ['Spice Route Catering', 'Caterer', 'Lagos', 'Small chops, grills and full buffet for 50 to 500.'], ['Frame Theory', 'Photographer', 'Abuja', 'Event photo and video with same day highlights.'],
  ['The Pavilion', 'Venue', 'Oyo', 'Open air hall for 600 guests with generator backup.'], ['Pulse Sound Systems', 'Sound and lights', 'Lagos', 'Line array, LED walls and lasers.'], ['Mixology Lab', 'Bartender', 'Abuja', 'Cocktail crews and mobile bars.'], ['DJ Aura', 'DJ', 'Oyo', 'Campus and club nights across Ibadan.'], ['Glam Crew', 'Makeup', 'Lagos', 'Backstage glam and fashion show teams.']
];
pages.vendors = function (q) {
  const t = q.type || ''; const types = Array.from(new Set(VENDORS.map(v => v[1])));
  const list = VENDORS.filter(v => !t || v[1] === t);
  return '<div class="page"><div class="wrap"><h1>Vendors</h1><p class="sub">DJs, caterers, photographers, venues and more in one place. Sample listings, this section can come after launch.</p><div class="chips" style="margin-bottom:20px"><a class="chip ' + (t ? '' : 'on') + '" href="#/vendors">All</a>' + types.map(x => '<a class="chip ' + (x === t ? 'on' : '') + '" href="#/vendors?type=' + encodeURIComponent(x) + '">' + x + '</a>').join('') + '</div><div class="grid">' + list.map(v => '<div class="card vendor"><span class="vtype">' + v[1] + '</span><h3>' + v[0] + '</h3><div class="meta">' + v[2] + '</div><p style="color:#ccc;font-size:14px">' + v[3] + '</p><a class="btn sm dark" href="#/support" style="margin-top:6px">Request a quote</a></div>').join('') + '</div></div></div>';
};
const legalNote = '<div class="notice">Draft wording for the prototype. A Nigerian lawyer must review and finalise this page before launch.</div>';
pages.terms = () => '<div class="page"><div class="wrap narrow legal-body"><h1>Terms of use</h1>' + legalNote + '<h2>Who we are</h2><p>VIBEVAULT Entertainment operates the VIBEVAULT ticketing platform. We provide the technology for hosts to sell tickets and for guests to buy them.</p><h2>What the platform does</h2><p>We sell tickets on behalf of hosts, collect payment through Paystack and issue QR tickets. The host is responsible for the event itself, including safety, licences and what happens at the venue.</p><h2>Buying tickets</h2><p>A ticket exists only after payment is confirmed by our payment partner. Each ticket carries a unique code that can be used once. Do not share your code publicly.</p><h2>Fees</h2><p>A service fee is shown in naira before you pay. It is set out clearly at checkout.</p><h2>Host responsibilities</h2><p>Hosts must provide accurate event details, honour valid tickets and follow the host agreement.</p></div></div>';
pages.privacy = () => '<div class="page"><div class="wrap narrow legal-body"><h1>Privacy policy</h1>' + legalNote + '<h2>What we collect</h2><p>For guests: name, email, phone number and payment references. For hosts: business details and bank details for payouts.</p><h2>Why</h2><p>To issue and deliver tickets, prevent fraud, pay hosts and give support.</p><h2>How long we keep it</h2><p>Order records are kept as required for accounting and dispute handling. Period to be confirmed with the lawyer.</p><h2>Your rights</h2><p>Under Nigerian data protection law you may ask to access, correct or delete your data. Contact ' + SUPPORT_EMAIL + '.</p></div></div>';
pages.refunds = () => '<div class="page"><div class="wrap narrow legal-body"><h1>Refund and cancellation policy</h1>' + legalNote + '<h2>Cancelled events</h2><ul><li>If a host cancels an event, every buyer is refunded in full.</li></ul><h2>Postponed events</h2><ul><li>Tickets stay valid for the new date. Buyers may ask for a refund if they cannot attend.</li></ul><h2>Venue changes</h2><ul><li>Hosts must announce venue changes. Refund rules for venue changes will be set with the lawyer.</li></ul><h2>Other refunds</h2><ul><li>Tickets are otherwise non refundable unless the host agrees. Contact support with your order reference.</li></ul><p>When a ticket is refunded, it stops working at once.</p></div></div>';
pages['host-agreement'] = () => '<div class="page"><div class="wrap narrow legal-body"><h1>Host agreement</h1>' + legalNote + '<h2>Payouts</h2><p>Hosts are paid after the event ends, minus refunds, to a verified bank account. Exact timing to be confirmed.</p><h2>Fees</h2><p>The buyer pays the service fee by default. Hosts may choose to cover it.</p><h2>Banned content and events</h2><p>Illegal activity, unsafe gatherings and hateful content are not allowed.</p><h2>Liability and safety</h2><p>Hosts are responsible for crowd safety, licences and compliance at their events.</p></div></div>';
function notFound() { return '<div class="page"><div class="wrap narrow"><h1>Page not found</h1><p class="sub">That page does not exist.</p><a class="btn" href="#/">Back home</a></div></div>'; }

/* ---------- shell + router ---------- */
function shell() {
  const r = S.session.role;
  document.body.innerHTML =
    '<div class="demobar"><div class="wrap"><span>PROTOTYPE · demo data · payments and emails are simulated</span><span><label for="roleSel" style="margin-right:6px">View as</label><select id="roleSel"><option value="guest">Guest</option>' + S.hosts.filter(x => x.status === 'approved').map(x => '<option value="host:' + x.id + '" ' + (r === 'host' && S.session.hostId === x.id ? 'selected' : '') + '>Host: ' + h(x.name) + '</option>').join('') + '<option value="host:h4" ' + (r === 'host' && S.session.hostId === 'h4' ? 'selected' : '') + '>Host: Owambe Collective (pending)</option><option value="admin" ' + (r === 'admin' ? 'selected' : '') + '>VIBEVAULT admin</option></select> <button id="resetBtn">Reset demo</button></span></div></div>' +
    '<header class="top"><div class="wrap"><a href="#/" aria-label="VIBEVAULT home">' + logo() + '</a><button class="burger" id="burger" aria-label="Menu">☰</button><nav class="main" id="nav">' +
    '<a href="#/explore" data-nav="explore">Events</a><a href="#/vendors" data-nav="vendors">Vendors</a><a href="#/tickets" data-nav="tickets">My Tickets</a><a href="#/scan" data-nav="scan">Door</a>' +
    (r === 'guest' ? '<a href="#/host-info" data-nav="host-info">Host</a><a class="btn sm" href="#/login">Sign in</a>' : (r === 'admin' ? '<a href="#/admin" data-nav="admin">Admin</a><a href="#/host" data-nav="host">Hosts</a>' : '<a href="#/host" data-nav="host">Dashboard</a>') + (r !== 'guest' ? '<a href="#" data-act="logout" class="btn sm dark">Sign out</a>' : '')) +
    '</nav></div></header><main id="app"></main>' +
    '<footer><div class="wrap"><div class="cols"><div>' + logo() + '<p class="meta" style="margin-top:10px;max-width:280px">Same People. New Vibes.<br>Nigeria\'s home for party and event tickets.</p><form class="newsletter" id="newsForm" style="margin-top:14px"><input type="email" id="newsEmail" placeholder="Email for event drops" aria-label="Newsletter email" required><button class="btn sm">Join</button></form></div>' +
    '<div><h4>Explore</h4><a href="#/explore">All events</a><a href="#/city/Lagos">Lagos</a><a href="#/city/Oyo">Oyo</a><a href="#/city/Abuja">Abuja</a><a href="#/vendors">Vendors</a></div>' +
    '<div><h4>Help</h4><a href="#/faq">FAQ</a><a href="#/support">Support</a><a href="#/recover">Recover tickets</a><a target="_blank" rel="noopener" href="https://wa.me/' + WHATSAPP + '">WhatsApp</a></div>' +
    '<div><h4>Legal</h4><a href="#/terms">Terms</a><a href="#/privacy">Privacy</a><a href="#/refunds">Refunds</a><a href="#/host-agreement">Host agreement</a></div></div>' +
    '<div class="legal"><span>Follow us: Instagram · TikTok · X · WhatsApp (handles to be claimed once the domain is bought)</span><br>© 2026 VIBEVAULT Entertainment. Prototype build for review. Not a live ticket seller.</div></div></footer>';
}
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, ''); const [path, query] = raw.split('?'); const q = {};
  (query || '').split('&').filter(Boolean).forEach(p => { const [k, v] = p.split('='); q[k] = decodeURIComponent(v || ''); });
  return { parts: path.split('/').filter(Boolean), q };
}
function render() {
  const { parts, q } = parseHash(); const route = parts[0] || 'home';
  if (route !== 'checkout' && holdInt) { clearInterval(holdInt); holdInt = null; }
  if (route !== 'scan') stopCamera();
  const app = $('#app'); if (!app) { shell(); return render(); }
  let html;
  try {
    if (route === 'home') html = pages.home();
    else if (route === 'explore') html = pages.explore(q);
    else if (route === 'city') html = pages.city(decodeURIComponent(parts[1] || ''));
    else if (route === 'event') html = pages.event(parts[1]);
    else if (route === 'checkout') html = pages.checkout(parts[1]);
    else if (route === 'success') html = pages.success(parts[1]);
    else if (route === 'failed') html = pages.failed(parts[1]);
    else if (route === 'tickets') html = pages.tickets();
    else if (route === 'recover') html = pages.tickets('recover');
    else if (route === 'scan') html = pages.scan();
    else if (route === 'host' && parts[1] === 'create') { html = pages.create(); }
    else if (route === 'host' && parts[1] === 'edit') { html = pages.create(parts[2]); }
    else if (route === 'host') html = pages.host();
    else if (route === 'admin') html = pages.admin();
    else if (route === 'login') html = pages.login(q);
    else if (pages[route]) html = pages[route](q);
    else html = notFound();
  } catch (e) { console.error(e); html = '<div class="page"><div class="wrap"><h1>Something broke</h1><p class="sub">' + h(e.message) + '</p></div></div>'; }
  app.innerHTML = html;
  $$('nav.main a').forEach(a => a.classList.toggle('on', a.dataset.nav === route));
  const nav = $('#nav'); if (nav) nav.classList.remove('open');
  if (route === 'checkout' && checkoutHold) startHoldTimer(parts[1]);
  if (!window.__noscroll) window.scrollTo(0, 0); window.__noscroll = false;
  document.title = route === 'event' && evOf(parts[1]) ? evOf(parts[1]).title + ' · VIBEVAULT' : 'VIBEVAULT · Same People. New Vibes.';
}
function rerender() { window.__noscroll = true; const y = window.scrollY; render(); window.scrollTo(0, y); }
function startHoldTimer(eventId) {
  if (holdInt) clearInterval(holdInt);
  const tick = () => {
    const el = $('#holdTimer'); if (!el) { clearInterval(holdInt); return; }
    const left = Math.max(0, checkoutHold.expires - now());
    el.textContent = String(Math.floor(left / 60000)).padStart(2, '0') + ':' + String(Math.floor(left % 60000 / 1000)).padStart(2, '0');
    if (left <= 0) { clearInterval(holdInt); releaseHold(checkoutHold.id); checkoutHold = null; closeModal(); toast('Your hold expired and the tickets were released'); location.hash = '#/event/' + eventId; }
  };
  tick(); holdInt = setInterval(tick, 1000);
}

/* ---------- events ---------- */
const act = {
  homecat(el) { const c = el.dataset.cat; $$('[data-act=homecat]').forEach(b => b.classList.toggle('on', b === el)); const live = S.events.filter(e => e.status === 'live' && !isPast(e) && (!c || e.category === c)).sort((a, b) => a.date - b.date); $('#homeGrid').innerHTML = live.length ? live.slice(0, 8).map(card).join('') : '<div class="empty">No events in this category yet.</div>'; },
  qty(el) {
    const ev = evOf(parseHash().parts[1]), t = el.dataset.t, d = +el.dataset.d; cart[ev.id] = cart[ev.id] || {};
    const tier = ev.tiers.find(x => x.id === t), cur = cart[ev.id][t] || 0, next = cur + d;
    if (next < 0) return; if (d > 0 && (cartTotal(ev) >= 4 || next > (tier.max || 4) || next > avail(ev, tier))) { toast('Maximum 4 tickets per order'); return; }
    if (next === 0) delete cart[ev.id][t]; else cart[ev.id][t] = next;
    $('#buy').innerHTML = buyPanel(ev);
  },
  checkout() { const id = parseHash().parts[1]; if (cartTotal(evOf(id))) { checkoutHold = null; location.hash = '#/checkout/' + id; } },
  jump(el, e) { e.preventDefault(); const t = $('#' + el.dataset.to); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  copylink() { navigator.clipboard && navigator.clipboard.writeText(location.href).then(() => toast('Link copied')).catch(() => toast('Copy the address bar link')); },
  share() { if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(() => {}); else act.copylink(); },
  save(el) { const id = el.dataset.ev; S.saved = S.saved.includes(id) ? S.saved.filter(x => x !== id) : S.saved.concat(id); save(); rerender(); },
  pm(el) { $$('.pm button').forEach(b => b.classList.toggle('on', b === el)); const t = el.textContent; $('#pmBody').innerHTML = t === 'Card' ? '<input class="pay-in" value="4084 0840 8408 4081" readonly><div style="display:flex;gap:8px"><input class="pay-in" value="12 / 30" readonly><input class="pay-in" value="408" readonly></div>' : t === 'USSD' ? '<div class="pay-in" style="background:#f6f6f6">Dial <b>*737*000*Amount#</b> on your phone (simulated).</div>' : '<div class="pay-in" style="background:#f6f6f6">Transfer to <b>Paystack Titan 0123456789</b> (simulated). Account expires in 30 minutes.</div>'; },
  paysuccess(el) { // in production Paystack calls our webhook; the browser callback only shows a screen
    const o = S.orders.find(x => x.ref === el.dataset.ref); const r = confirmPayment(o.ref, o.total * 100); closeModal();
    if (!r.ok) { toast('Verification failed: ' + r.why); return; }
    checkoutHold = null; location.hash = '#/success/' + o.id;
  },
  payfail(el) { const o = S.orders.find(x => x.ref === el.dataset.ref); o.status = 'failed'; if (o.holdId) releaseHold(o.holdId); checkoutHold = null; save(); closeModal(); location.hash = '#/failed/' + o.id; },
  dupwebhook(el) { const o = S.orders.find(x => x.ref === el.dataset.ref); const before = S.tickets.filter(t => t.orderId === o.id).length; const r = confirmPayment(o.ref, o.total * 100); const after = S.tickets.filter(t => t.orderId === o.id).length; toast(r.duplicate && before === after ? 'Duplicate webhook ignored. Still ' + after + ' tickets.' : 'Unexpected result'); },
  emailprev(el) {
    const o = S.orders.find(x => x.id === el.dataset.oid), ev = evOf(o.eventId), tk = S.tickets.filter(t => t.orderId === o.id);
    modal('<div class="emailprev" style="margin:0;padding:20px"><div class="eh">VIBEVAULT</div><p><b>Your tickets for ' + h(ev.title) + '</b></p><p style="color:#555;margin:8px 0">Hi ' + h(o.name.split(' ')[0]) + ', payment confirmed. Show these codes at the door. From tickets@ on your domain.</p>' + tk.map(t => '<div style="display:flex;gap:12px;align-items:center;border-top:1px solid #eee;padding:10px 0"><div style="width:84px;flex:none">' + qrSvg(t.code) + '</div><div><b>' + h(t.tierName) + '</b><div style="font-size:12px;color:#555">' + fmtDate(ev.date) + ' · ' + fmtTime(ev.date) + '<br>' + h(ev.venue) + '</div></div></div>').join('') + '<p style="margin-top:10px;font-size:13px">Lost this email? Visit My Tickets any time.</p></div><button class="btn block dark" data-act="closemodal" style="background:#111;color:#fff">Close</button>');
  },
  closemodal: closeModal,
  dlpng(el) { downloadTicketPng(S.tickets.find(t => t.code === el.dataset.code)); },
  printtk(el) { window.print(); },
  ics(el) { downloadIcs(evOf(el.dataset.ev)); },
  tkout() { tkSession = null; rerender(); },
  scanexit() { stopCamera(); scan.eventId = null; scan.last = null; rerender(); },
  camstart() { startCamera(); },
  offtoggle() { if (scan.offline) { scan.offline = false; syncQueue(); } else { scan.offline = true; toast('Offline mode. Scans are queued.'); } stopCamera(); rerender(); },
  samplescan(el) { doScan(el.dataset.code); },
  hostsel(el) { hostSel = el.dataset.ev; rerender(); },
  exportcsv(el) { const ev = evOf(el.dataset.ev); const rows = [['Name', 'Email', 'Phone', 'Tier', 'Status', 'Order ref']]; S.tickets.filter(t => t.eventId === ev.id && t.status !== 'void').forEach(t => { const o = S.orders.find(x => x.id === t.orderId); rows.push([t.holder, o.email, o.phone, t.tierName, t.status, o.ref]); }); downloadCsv(ev.title.replace(/\W+/g, '-') + '-attendees.csv', rows); },
  reqpayout(el) { const ev = evOf(el.dataset.ev), hh = host(ev.hostId); if (!hh.bank || !hh.bank.verified) { toast('Add and verify bank details first'); return; } ev.payout = 'requested'; save(); rerender(); toast('Payout requested'); },
  reqpromo(el) { const ev = evOf(el.dataset.ev); ev.promoReq = true; save(); rerender(); toast('Promotion requested. Payment is simulated in this prototype.'); },
  addtier() { syncTierInputs(); draftTiers.push({ id: 't' + (draftTiers.length + 1) + uid(''), name: '', price: 0, qty: 50, gender: 'any', saleStart: null, saleEnd: null, max: 4 }); $('#tierList').innerHTML = tierRows(); },
  rmtier(el) { syncTierInputs(); draftTiers.splice(+el.dataset.i, 1); $('#tierList').innerHTML = tierRows(); },
  loginas(el) { S.session = { role: 'host', hostId: el.dataset.id }; save(); location.hash = '#/host'; shell(); render(); },
  loginadmin() { S.session = { role: 'admin', hostId: null }; save(); location.hash = '#/admin'; shell(); render(); },
  logout() { S.session = { role: 'guest', hostId: null }; save(); location.hash = '#/'; shell(); render(); },
  admintab(el) { adminTab = el.dataset.t; rerender(); },
  hoststatus(el) { host(el.dataset.id).status = el.dataset.s; save(); rerender(); },
  evstatus(el) { evOf(el.dataset.id).status = el.dataset.s; save(); rerender(); },
  togglepromo(el) { const e = evOf(el.dataset.id); e.promoted = !e.promoted; e.promoReq = false; save(); rerender(); },
  markpaid(el) { evOf(el.dataset.id).payout = 'paid'; save(); rerender(); },
  cancelev(el) { const e = evOf(el.dataset.id); if (!confirm('Cancel this event and refund every buyer?')) return; e.status = 'cancelled'; S.orders.filter(o => o.eventId === e.id && o.status === 'paid').forEach(o => refundOrder(o.id)); save(); rerender(); toast('Event cancelled and orders refunded'); },
  refund(el) { if (!confirm('Refund this full order? Its tickets stop working at once.')) return; refundOrder(el.dataset.id); rerender(); toast('Order refunded. Tickets are now invalid.'); },
  clearflag(el) { S.flags = S.flags.filter(f => f.id !== el.dataset.id); save(); rerender(); }
};
function syncTierInputs() {
  $$('[data-tf]').forEach(inp => {
    const t = draftTiers[+inp.dataset.i]; if (!t) return; const k = inp.dataset.tf;
    if (k === 'price' || k === 'qty') t[k] = Math.max(0, +inp.value || 0);
    else if (k === 'saleStart' || k === 'saleEnd') t[k] = inp.value ? new Date(inp.value).getTime() : null;
    else t[k] = inp.value;
  });
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = act[el.dataset.act]; if (fn) { if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e => {
  if (e.target.id === 'roleSel') { const v = e.target.value; S.session = v === 'guest' ? { role: 'guest', hostId: null } : v === 'admin' ? { role: 'admin', hostId: null } : { role: 'host', hostId: v.split(':')[1] }; save(); shell(); render(); }
});
document.addEventListener('submit', e => {
  const f = e.target; e.preventDefault();
  if (f.id === 'homeSearch') { location.hash = '#/explore?' + qs({ q: $('#q').value, city: $('#fcity').value, cat: $('#fcat').value, price: $('#fprice').value }); }
  if (f.id === 'newsForm') { S.subscribers.push($('#newsEmail').value); save(); f.reset(); toast('You are on the list'); }
  if (f.id === 'supForm') { S.messages.push({ n: $('#sn').value, e: $('#se').value, m: $('#sm').value, at: now() }); save(); f.reset(); toast('Message sent. We will reply by email.'); }
  if (f.id === 'coForm') {
    const name = $('#cname').value.trim(), email = $('#cemail').value.trim(), phone = $('#cphone').value.trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || phone.replace(/\D/g, '').length < 10) { toast('Check your name, email and phone'); return; }
    const id = parseHash().parts[1], ev = evOf(id), c = cart[id];
    // SERVER: amounts are calculated on the server, never taken from the browser
    const items = ev.tiers.filter(t => c[t.id]).map(t => ({ tierId: t.id, name: t.name, qty: c[t.id], price: t.price, fee: feeFor(ev, t.price) }));
    const sub = items.reduce((a, i) => a + i.price * i.qty, 0), fee = items.reduce((a, i) => a + i.fee * i.qty, 0);
    const absorbed = ev.absorbFee ? items.reduce((a, i) => a + platformFee(i.price) * i.qty, 0) : 0;
    const order = { id: uid('o'), ref: 'VV' + secureCode(10), eventId: id, name, email, phone, items, subtotal: sub, fee, absorbed, total: sub + fee, status: 'pending', createdAt: now(), paidAt: 0, holdId: checkoutHold && checkoutHold.id };
    S.orders.push(order); save(); tkSession = null; paystackModal(order);
  }
  if (f.id === 'tkForm') {
    const em = $('#tkemail').value.trim().toLowerCase(), box = $('#tkCodeBox');
    if (box.classList.contains('hide')) { box.classList.remove('hide'); $('#tkBtn').textContent = 'Show my tickets'; toast('Code sent (prototype code: 123456)'); return; }
    if ($('#tkcode').value.trim() !== '123456') { toast('That code is not right'); return; }
    tkSession = em; rerender();
  }
  if (f.id === 'scanLogin') {
    const ev = evOf($('#sev').value); if ($('#spin').value.trim() !== ev.doorPin) { toast('Wrong PIN'); return; }
    scan.eventId = ev.id; scan.last = null; rerender();
  }
  if (f.id === 'manual') { doScan($('#mcode').value); }
  if (f.id === 'bankForm') {
    const acct = $('#bacct').value.trim(); if (!/^\d{10}$/.test(acct)) { toast('Account number must be 10 digits'); return; }
    const hh = host(f.dataset.host); hh.bank = { bank: $('#bbank').value, acct, name: hh.name.toUpperCase() + ' (VERIFIED NAME)', verified: true }; save(); rerender(); toast('Account name verified');
  }
  if (f.id === 'signupForm') {
    const nh = { id: uid('h'), name: $('#shn').value.trim(), email: $('#she').value.trim(), phone: '', status: 'pending', bank: null, about: 'New host on VIBEVAULT.' };
    S.hosts.push(nh); S.session = { role: 'host', hostId: nh.id }; save(); shell(); location.hash = '#/host/create'; render(); toast('Account created. Waiting for approval before you can publish.');
  }
  if (f.id === 'feeForm') { S.settings.feePct = Math.max(0, +$('#fpct').value || 0); S.settings.minFee = Math.max(0, +$('#fmin').value || 0); S.settings.holdMinutes = Math.max(1, +$('#fhold').value || 10); S.settings.approveEvents = $('#fappr').checked; save(); rerender(); toast('Settings saved'); }
  if (f.id === 'evForm') {
    syncTierInputs();
    const mode = (e.submitter && e.submitter.dataset.mode) || 'publish', id = f.dataset.id, hh = curHost() || host('h1');
    if (draftTiers.some(t => !t.name.trim())) { toast('Every tier needs a name'); return; }
    const base = { title: $('#etitle').value.trim(), category: $('#ecat').value, city: $('#ecity').value, venue: $('#evenue').value.trim(), date: new Date($('#edate').value).getTime(), desc: $('#edesc').value.trim(), absorbFee: $('#eabs').checked, tiers: draftTiers.map((t, i) => ({ id: t.id || 't' + (i + 1), name: t.name.trim(), price: t.price, qty: t.qty, gender: t.gender, saleStart: t.saleStart, saleEnd: t.saleEnd, max: 4 })) };
    const needsApproval = S.session.role !== 'admin' && (hh.status !== 'approved' || S.settings.approveEvents);
    const status = mode === 'draft' ? 'draft' : needsApproval ? 'pending' : 'live';
    const done = (img) => {
      let ev = id ? evOf(id) : null;
      if (ev) Object.assign(ev, base, { status: ev.status === 'cancelled' ? 'cancelled' : status }); else { ev = Object.assign({ id: uid('e'), hostId: hh.id, promoted: false, doorPin: String(Math.floor(1000 + Math.random() * 9000)), grad: Math.floor(Math.random() * GRADS.length), img: null, payout: 'none' }, base, { status }); S.events.push(ev); }
      if (img) ev.img = img;
      save(); draftTiers = []; hostSel = ev.id; location.hash = '#/host';
      toast(status === 'live' ? 'Event published' : status === 'pending' ? 'Submitted for approval' : 'Draft saved');
    };
    const file = $('#eposter').files[0];
    if (file) resizeImage(file, done); else done(null);
  }
});
function resizeImage(file, cb) {
  const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const m = 800, s = Math.min(1, m / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .72)); }; im.onerror = () => cb(null); im.src = r.result; }; r.readAsDataURL(file);
}
document.addEventListener('click', e => {
  if (e.target.id === 'burger') $('#nav').classList.toggle('open');
  if (e.target.id === 'resetBtn') resetDemo();
});
window.addEventListener('hashchange', render);

/* ---------- boot ---------- */
load(); shell(); render();
window.__vv = { get state() { return S; }, confirmPayment, scanTicket };
})();
