/* ──────────────────────────────────────────
   No3 Hangout — Interactive JavaScript v3.2
   Features: Cart · Checkout · Product sheet ·
   Smart search · Filters · Sort · Favourites ·
   Notifications · Bottom Nav · Back-to-top ·
   Lenis in sheets · Category arc ·
   Trending chips · Combo deals · Animations
   ────────────────────────────────────────── */

/* ═══════ STATE ═══════ */
const state = {
  cart: [],
  favourites: new Set(),
  activeCategory: 'all',
  activeFilter: 'all',
  searchQuery: '',
  sortMode: 'default'
};

/* ═══════ DOM REFS ═══════ */
const $ = id => document.getElementById(id);
const cartBtn       = $('cart-btn');
const cartClose     = $('cart-close');
const cartSidebar   = $('cart-sidebar');
const cartOverlay   = $('cart-overlay');
const cartItemsEl   = $('cart-items');
const cartFooterEl  = $('cart-footer');
const cartEmptyEl   = $('cart-empty');
const cartTotalEl   = $('cart-total');
const cartGrandEl   = $('cart-grand-total');
const cartHeaderSub = $('cart-header-sub');
const checkoutBtn   = $('checkout-btn');
const toastEl       = $('toast');
const promoBanner   = $('promo-banner');
const closeBanner   = $('close-banner');
const itemCountEl   = $('item-count');
const menuGrid      = $('menu-grid');
const categoryList  = $('category-list');
const searchInput   = $('search-input');
const searchClear   = $('search-clear');
const mobileSearchInput = $('mobile-search-input');
const searchNotice  = $('search-notice');
const searchNoticeText = $('search-notice-text');
const clearSearchBtn = $('clear-search-btn');
const sortSelect    = $('sort-select');
const backToTop     = $('back-to-top');
const browseMenuBtn = $('browse-menu-btn');
const siteHeader    = $('site-header');
const filterBar     = $('filter-bar');
const filterBtn     = $('filter-btn');
const menuEmpty     = $('menu-empty');
const headerFavBtn  = $('header-fav-btn');
const bottomNav     = $('bottom-nav');
const cartCountEls  = document.querySelectorAll('.cart-count');
const originalOrder = Array.from(document.querySelectorAll('.menu-card'));

/* ═══════ HELPERS ═══════ */
const rupees   = n => '₹' + n.toLocaleString('en-IN');
const rupees2  = n => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad2     = n => String(n).padStart(2, '0');
// Lenis is initialised in index.html; if its CDN script fails, `lenis` is left
// uninitialised and even `typeof lenis` throws — so guard with try/catch.
const hasLenis = () => { try { return typeof lenis !== 'undefined' && !!lenis; } catch { return false; } };

// Card data is read straight from the menu markup, so the HTML stays the source of truth
function cardData(card) {
  const addBtn = card.querySelector('.add-btn');
  return {
    id:      card.id,
    favId:   card.querySelector('.card-fav').dataset.id,
    name:    card.querySelector('.card-name').textContent.trim(),
    short:   addBtn.dataset.name,
    price:   parseInt(addBtn.dataset.price, 10),
    img:     card.querySelector('.card-img').getAttribute('src'),
    desc:    card.querySelector('.card-desc').textContent.trim(),
    cat:     card.dataset.cat,
    rating:  card.querySelector('.rating-val').textContent,
    reviews: card.querySelector('.rating-count').textContent,
    time:    card.querySelector('.card-time').textContent,
    kcal:    card.querySelector('.card-cal').textContent,
    tags:    Array.from(card.querySelectorAll('.card-tags .tag')).map(t => t.outerHTML).join('')
  };
}

// Smooth (Lenis) scrolling inside the cart list and product sheet. Each gets its
// own instance bound to the panel; while one handles a wheel event it marks it so
// the (stopped) page instance ignores it. Touch stays native, like the page.
const LENIS_OPTS = {
  duration: 1.2,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  syncTouch: false,
  touchMultiplier: 2
};
function panelLenis(wrapper, content) {
  if (typeof Lenis === 'undefined' || !wrapper || !content) return null;
  try { return new Lenis({ ...LENIS_OPTS, wrapper, content }); } catch { return null; }
}
const cartLenis    = panelLenis($('cart-scroll'), $('cart-items'));
const productLenis = panelLenis($('product-sheet'), $('ps-content'));
const panelLenises = [cartLenis, productLenis].filter(Boolean);
if (panelLenises.length) {
  const tick = time => { panelLenises.forEach(l => l.raf(time)); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function resetPanelScroll(instance, el) {
  if (instance) { instance.resize(); instance.scrollTo(0, { immediate: true, force: true }); }
  else if (el) el.scrollTop = 0;
}

// Lock page scroll while a sheet/overlay is open (and pause Lenis if present)
let scrollLocks = 0;
function lockScroll() {
  if (scrollLocks++ === 0) {
    document.body.style.overflow = 'hidden';
    if (hasLenis()) lenis.stop();
  }
}
function unlockScroll() {
  if (scrollLocks === 0) return;
  if (--scrollLocks === 0) {
    document.body.style.overflow = '';
    if (hasLenis()) lenis.start();
  }
}

/* ═══════ PROMO BANNER CLOSE ═══════ */
closeBanner.addEventListener('click', () => {
  promoBanner.style.height = promoBanner.offsetHeight + 'px';
  requestAnimationFrame(() => {
    promoBanner.style.height = '0';
    promoBanner.style.opacity = '0';
    promoBanner.style.overflow = 'hidden';
    promoBanner.style.padding = '0';
    promoBanner.style.border = 'none';
  });
});

/* ═══════ SCROLL HELPERS ═══════ */
function scrollToY(top) {
  if (hasLenis()) lenis.scrollTo(top);
  else window.scrollTo({ top, behavior: 'smooth' });
}
function scrollToEl(el) {
  if (!el) return;
  const offset = siteHeader.offsetHeight + 8;
  scrollToY(el.getBoundingClientRect().top + window.scrollY - offset);
}
filterBtn.addEventListener('click', () => scrollToEl(filterBar));
// In-page links (#menu, #combos, …) glide through Lenis when it is running
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link || !hasLenis() || e.defaultPrevented) return;
  const hash = link.getAttribute('href');
  const target = hash === '#top' ? null : document.querySelector(hash);
  if (hash !== '#top' && !target) return;
  e.preventDefault();
  if (target) scrollToEl(target); else scrollToY(0);
});

/* ═══════ CART OPEN / CLOSE ═══════ */
function openCart() {
  if (cartSidebar.classList.contains('open')) return;
  closeNotifications();
  resetPanelScroll(cartLenis, $('cart-scroll'));
  cartSidebar.classList.add('open');
  cartSidebar.setAttribute('aria-hidden', 'false');
  cartOverlay.classList.add('visible');
  lockScroll();
}
function closeCart() {
  if (!cartSidebar.classList.contains('open')) return;
  cartSidebar.classList.remove('open');
  cartSidebar.setAttribute('aria-hidden', 'true');
  cartOverlay.classList.remove('visible');
  unlockScroll();
}
cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
if (browseMenuBtn) {
  browseMenuBtn.addEventListener('click', () => { closeCart(); });
}

/* ═══════ TOAST ═══════ */
let toastTimeout;
function showToast(msg) {
  clearTimeout(toastTimeout);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

/* ═══════ CART RENDER ═══════ */
function renderCart() {
  const hasItems = state.cart.length > 0;
  cartEmptyEl.style.display  = hasItems ? 'none' : 'flex';
  cartFooterEl.style.display = hasItems ? 'block' : 'none';

  // Remove old items
  Array.from(cartItemsEl.children).forEach(el => {
    if (!el.classList.contains('cart-empty')) el.remove();
  });

  state.cart.forEach(item => {
    const editable = !!document.getElementById(item.id)?.classList.contains('menu-card');
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <span class="cart-thumb">${item.img ? `<img src="${item.img}" alt="" />` : ''}</span>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-actions">
          <div class="cart-qty-wrap">
            <button class="qty-btn" data-id="${item.id}" data-action="dec" aria-label="Decrease ${item.name}">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" data-id="${item.id}" data-action="inc" aria-label="Increase ${item.name}">+</button>
          </div>
          ${editable ? `<button class="cart-edit" data-id="${item.id}" aria-label="Edit ${item.name}">Edit</button>` : ''}
        </div>
      </div>
      <div class="cart-item-price">${rupees(item.price * item.qty)}</div>
    `;
    cartItemsEl.appendChild(el);
  });

  // Totals
  const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = state.cart.reduce((s, i) => s + i.qty, 0);
  cartTotalEl.textContent = rupees(subtotal);
  if (cartGrandEl) cartGrandEl.textContent = rupees2(subtotal);

  // Header sub
  if (cartHeaderSub) {
    cartHeaderSub.textContent = hasItems
      ? `${totalQty} item${totalQty !== 1 ? 's' : ''} · ${rupees(subtotal)}`
      : 'Add items to get started';
  }

  // Cart badges (header + bottom nav)
  cartCountEls.forEach(el => {
    el.textContent = totalQty;
    el.classList.toggle('empty', totalQty === 0);
    if (totalQty > 0) {
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 300);
    }
  });
}

/* ═══════ ADD TO CART ═══════ */
function addToCart(name, price, id, qty = 1) {
  const existing = state.cart.find(i => i.id === id);
  if (existing) {
    existing.qty += qty;
    showToast(`+${qty} ${name} 🎉`);
  } else {
    const img = document.getElementById(id)?.querySelector('img')?.getAttribute('src') || '';
    state.cart.push({ id, name, price: parseInt(price, 10), qty, img });
    showToast(qty > 1 ? `${qty} × ${name} added to cart 🛒` : `${name} added to cart 🛒`);
  }
  renderCart();
}

// Brief ✓ feedback on an add button, restoring its original markup afterwards
function flashAdded(btn, html) {
  if (!btn.dataset.orig) btn.dataset.orig = btn.innerHTML;
  clearTimeout(btn._addedTimer);
  btn.classList.add('added');
  btn.innerHTML = html;
  btn._addedTimer = setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = btn.dataset.orig; }, 1500);
}
const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

/* ═══════ CART QTY + EDIT (delegated) ═══════ */
cartItemsEl.addEventListener('click', e => {
  const edit = e.target.closest('.cart-edit');
  if (edit) { openProduct(document.getElementById(edit.dataset.id), { edit: true }); return; }
  const btn = e.target.closest('.qty-btn');
  if (!btn) return;
  const item = state.cart.find(i => i.id === btn.dataset.id);
  if (!item) return;
  if (btn.dataset.action === 'inc') item.qty++;
  else { item.qty--; if (item.qty <= 0) state.cart.splice(state.cart.indexOf(item), 1); }
  renderCart();
});

/* ═══════ ADD-TO-CART BUTTONS (menu cards) ═══════ */
document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card  = btn.closest('.menu-card');
    const id    = card ? card.id : btn.dataset.id || 'generic';
    addToCart(btn.dataset.name, btn.dataset.price, id);
    flashAdded(btn, `${CHECK_SVG}<span class="add-label">Added</span>`);
  });
});

/* ═══════ COMBO ADD BUTTONS ═══════ */
document.querySelectorAll('.combo-add').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.closest('.combo-item').id;
    addToCart(btn.dataset.name, btn.dataset.price, id);
    flashAdded(btn, '✓ Added');
  });
});

/* ═══════ CHECKOUT — make payment ═══════ */
checkoutBtn.addEventListener('click', () => {
  if (checkoutBtn.classList.contains('paying')) return;
  checkoutBtn.classList.add('paying');
  setTimeout(() => {
    showToast('🎉 Payment done — order confirmed! Hang tight…');
    state.cart = [];
    renderCart();
    closeCart();
    setTimeout(() => checkoutBtn.classList.remove('paying'), 450);
  }, 900);
});

/* ═══════ FAVOURITES ═══════ */
function toggleFav(favId) {
  const on = !state.favourites.has(favId);
  if (on) state.favourites.add(favId); else state.favourites.delete(favId);
  document.querySelectorAll(`.card-fav[data-id="${favId}"]`).forEach(b => b.classList.toggle('active', on));
  if (psCard && cardData(psCard).favId === favId) syncSheetFav();
  showToast(on ? 'Added to favourites ❤️' : 'Removed from favourites');
  if (state.activeFilter === 'fav') applyFilters();
}
document.querySelectorAll('.card-fav').forEach(btn => {
  btn.addEventListener('click', () => toggleFav(btn.dataset.id));
});

/* Show saved items (header heart + bottom nav) */
function setFilter(filter) {
  state.activeFilter = filter;
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.filter === filter));
  headerFavBtn?.classList.toggle('active', filter === 'fav');
  applyFilters();
}
function toggleSaved() {
  const next = state.activeFilter === 'fav' ? 'all' : 'fav';
  setFilter(next);
  if (next === 'fav') {
    if (!state.favourites.size) showToast('Tap ♡ on any item to save it');
    scrollToEl(filterBar);
  }
}
headerFavBtn?.addEventListener('click', toggleSaved);

/* ═══════ PRODUCT SHEET — order control ═══════ */
const productSheet = $('product-sheet');
const psOverlay    = $('ps-overlay');
const psTitle      = $('ps-title');
const psImg        = $('ps-img');
const psQtyEl      = $('ps-qty');
const psMinus      = $('ps-minus');
const psPlus       = $('ps-plus');
const psPriceEl    = $('ps-price');
const psName       = $('ps-name');
const psTags       = $('ps-tags');
const psDesc       = $('ps-desc');
const psMore       = $('ps-more');
const psFav        = $('ps-fav');
const psAdd        = $('ps-add');
const psAddLabel   = $('ps-add-label');
const psInfoBtn    = $('ps-info-btn');
const psInfo       = $('ps-info');
const PS_MAX_QTY   = 20;
let psCard = null;   // the menu card shown in the sheet
let psQty  = 1;
let psEdit = false;  // editing an item already in the cart
let psReturnFocus = null;

function renderSheetQty() {
  const { price } = cardData(psCard);
  psQtyEl.textContent = pad2(psQty);
  psPriceEl.textContent = rupees2(price * psQty);
  psMinus.disabled = psQty <= 1;
  psPlus.disabled  = psQty >= PS_MAX_QTY;
}
function syncSheetFav() {
  const on = state.favourites.has(cardData(psCard).favId);
  psFav.classList.toggle('active', on);
  psFav.setAttribute('aria-label', on ? 'Remove from favourites' : 'Add to favourites');
}

function openProduct(card, { edit = false } = {}) {
  if (!card) return;
  const d = cardData(card);
  const inCart = state.cart.find(i => i.id === d.id);
  psCard = card;
  psEdit = edit && !!inCart;
  psQty  = psEdit ? inCart.qty : 1;

  // Two-tone title: last word lighter ("Double Smash <span>Burger</span>")
  const words = d.short.split(' ');
  const last  = words.pop();
  psTitle.innerHTML = words.length ? `${words.join(' ')} <span>${last}</span>` : last;
  psImg.src = d.img;
  psImg.alt = d.name;
  psImg.classList.remove('swap'); void psImg.offsetWidth; psImg.classList.add('swap');
  psName.textContent = d.name;
  psTags.innerHTML = d.tags;
  psDesc.textContent = d.desc;
  psDesc.classList.remove('expanded');
  psMore.textContent = 'Read more';
  psMore.setAttribute('aria-expanded', 'false');
  $('ps-info-rating').textContent = `${d.rating} ${d.reviews}`;
  $('ps-info-time').textContent = d.time;
  $('ps-info-kcal').textContent = d.kcal;
  psInfo.hidden = true;
  psInfoBtn.setAttribute('aria-expanded', 'false');
  psAddLabel.textContent = psEdit ? 'Update cart' : 'Add to cart';
  psAdd.classList.remove('added');
  syncSheetFav();
  renderSheetQty();

  // "Read more" only when the description is actually clamped
  requestAnimationFrame(() => { psMore.hidden = psDesc.scrollHeight <= psDesc.clientHeight + 1; });

  if (!productSheet.classList.contains('open')) {
    psReturnFocus = document.activeElement;
    productSheet.classList.add('open');
    productSheet.setAttribute('aria-hidden', 'false');
    psOverlay.classList.add('visible');
    lockScroll();
  }
  resetPanelScroll(productLenis, productSheet);
  closeCart();
  setTimeout(() => psAdd.focus({ preventScroll: true }), 60);
}
function closeProduct() {
  if (!productSheet.classList.contains('open')) return;
  productSheet.classList.remove('open');
  productSheet.setAttribute('aria-hidden', 'true');
  psOverlay.classList.remove('visible');
  unlockScroll();
  if (psReturnFocus && document.contains(psReturnFocus)) psReturnFocus.focus({ preventScroll: true });
}

function stepQty(delta) {
  const next = Math.min(PS_MAX_QTY, Math.max(1, psQty + delta));
  if (next === psQty) return;
  psQty = next;
  renderSheetQty();
  psQtyEl.classList.remove('bump'); void psQtyEl.offsetWidth; psQtyEl.classList.add('bump');
}
psMinus.addEventListener('click', () => stepQty(-1));
psPlus.addEventListener('click', () => stepQty(1));
psFav.addEventListener('click', () => toggleFav(cardData(psCard).favId));
psMore.addEventListener('click', () => {
  const open = psDesc.classList.toggle('expanded');
  psMore.textContent = open ? 'Show less' : 'Read more';
  psMore.setAttribute('aria-expanded', String(open));
});
psInfoBtn.addEventListener('click', () => {
  psInfo.hidden = !psInfo.hidden;
  psInfoBtn.setAttribute('aria-expanded', String(!psInfo.hidden));
});
psAdd.addEventListener('click', () => {
  const d = cardData(psCard);
  if (psEdit) {
    const item = state.cart.find(i => i.id === d.id);
    if (item) { item.qty = psQty; renderCart(); showToast(`${d.short} updated · ${psQty} in cart`); }
  } else {
    addToCart(d.short, d.price, d.id, psQty);
  }
  psAdd.classList.add('added');
  psAddLabel.textContent = psEdit ? 'Updated' : 'Added';
  setTimeout(() => { closeProduct(); if (psEdit) openCart(); }, 650);
});
$('ps-back').addEventListener('click', closeProduct);
psOverlay.addEventListener('click', closeProduct);

// Menu cards: the name button stretches over the whole card
menuGrid.addEventListener('click', e => {
  const open = e.target.closest('.card-open');
  if (open) openProduct(open.closest('.menu-card'));
});
// Hero floating cards
document.querySelectorAll('.float-card[data-open]').forEach(btn => {
  btn.addEventListener('click', () => openProduct($(btn.dataset.open)));
});

/* ═══════ CATEGORY FILTER — arc carousel ═══════ */
const catItems = Array.from(categoryList.querySelectorAll('.cat-item'));
const ARC_DEPTH = 34; // px an item drops at the carousel's edge

function centreOn(item, smooth = true) {
  const left = item.offsetLeft + item.offsetWidth / 2 - categoryList.clientWidth / 2;
  categoryList.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
}
// Items ride a curve: the one in the middle sits highest, neighbours drop away
let arcFrame = 0;
function updateArc() {
  arcFrame = 0;
  const box = categoryList.getBoundingClientRect();
  const mid = box.left + box.width / 2;
  const half = Math.max(box.width / 2, 1);
  catItems.forEach(item => {
    const r = item.getBoundingClientRect();
    const d = Math.min(1.4, Math.abs(r.left + r.width / 2 - mid) / half);
    item.style.setProperty('--arc', (d * d * ARC_DEPTH).toFixed(1));
  });
}
const queueArc = () => { if (!arcFrame) arcFrame = requestAnimationFrame(updateArc); };
categoryList.addEventListener('scroll', queueArc, { passive: true });
window.addEventListener('resize', queueArc);

categoryList.addEventListener('click', e => {
  const btn = e.target.closest('.cat-item');
  if (!btn) return;
  catItems.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  btn.classList.add('active');
  btn.setAttribute('aria-pressed', 'true');
  centreOn(btn);
  state.activeCategory = btn.dataset.cat;
  applyFilters();
});
// Start centred on the active ("All") item
const activeCat = categoryList.querySelector('.cat-item.active');
if (activeCat) centreOn(activeCat, false);
updateArc();

/* ═══════ PILL FILTER ═══════ */
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => setFilter(pill.dataset.filter));
});

/* ═══════ SORT ═══════ */
sortSelect.addEventListener('change', () => {
  state.sortMode = sortSelect.value;
  applyFilters();
});

/* ═══════ SEARCH ═══════ */
function handleSearch(q) {
  state.searchQuery = q.trim().toLowerCase();
  searchClear.style.display = state.searchQuery ? 'flex' : 'none';
  // Keep every search input in sync
  if (searchInput.value !== q) searchInput.value = q;
  if (mobileSearchInput && mobileSearchInput.value !== q) mobileSearchInput.value = q;
  if (soInput.value !== q) soInput.value = q;
  applyFilters();
}
searchClear.addEventListener('click', e => { e.stopPropagation(); handleSearch(''); });
if (clearSearchBtn) clearSearchBtn.addEventListener('click', () => handleSearch(''));

function matchesQuery(card, q) {
  const name = (card.querySelector('.card-name')?.textContent || '').toLowerCase();
  const desc = (card.querySelector('.card-desc')?.textContent || '').toLowerCase();
  return name.includes(q) || desc.includes(q) || card.dataset.cat.includes(q);
}

/* ═══════ SMART SEARCH OVERLAY ═══════ */
const searchOverlay = $('search-overlay');
const soInput       = $('so-input');
const soClear       = $('so-clear');
const soRecentWrap  = $('so-recent-wrap');
const soRecent      = $('so-recent');
const soPopularWrap = $('so-popular-wrap');
const soResultsWrap = $('so-results-wrap');
const soResults     = $('so-results');
const soResultsTitle = $('so-results-title');
const soNone        = $('so-none');
const RECENT_KEY    = 'no3-recent-searches';
const RECENT_MAX    = 8;
const HISTORY_SVG   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><polyline points="3 4 3.5 8.5 8 8"/><polyline points="12 8 12 12 15 14"/></svg>`;
const PLUS_SVG      = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
let soReturnFocus = null;

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; }
}
function saveRecent(term) {
  term = term.trim();
  if (!term) return;
  const list = [term, ...loadRecent().filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, RECENT_MAX);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
}
function renderRecent() {
  const list = loadRecent();
  soRecent.replaceChildren(...list.map(term => {
    const chip = document.createElement('button');
    chip.className = 'so-chip';
    chip.dataset.q = term;
    chip.innerHTML = HISTORY_SVG;
    const label = document.createElement('span');
    label.textContent = term;
    chip.append(label);
    return chip;
  }));
  soRecentWrap.hidden = !list.length;
}

// Highlight the matched part of a name (built with DOM nodes, never innerHTML)
function highlight(text, q) {
  const frag = document.createDocumentFragment();
  const i = text.toLowerCase().indexOf(q);
  if (!q || i < 0) { frag.append(text); return frag; }
  const mark = document.createElement('mark');
  mark.textContent = text.slice(i, i + q.length);
  frag.append(text.slice(0, i), mark, text.slice(i + q.length));
  return frag;
}

function renderResults() {
  const q = soInput.value.trim().toLowerCase();
  soClear.hidden = !q;
  soPopularWrap.hidden = !!q;
  soRecentWrap.hidden = !!q || !loadRecent().length;
  soResultsWrap.hidden = !q;
  if (!q) return;

  const hits = originalOrder.filter(card => matchesQuery(card, q));
  soResultsTitle.textContent = `${hits.length} result${hits.length !== 1 ? 's' : ''}`;
  soNone.hidden = hits.length > 0;
  $('so-see-all').hidden = !hits.length;
  soResults.replaceChildren(...hits.map(card => {
    const d = cardData(card);
    const li = document.createElement('li');
    li.className = 'so-result';
    li.innerHTML = `
      <button class="so-open" data-id="${d.id}">
        <img src="${d.img}" alt="" />
        <span><span class="so-name"></span><span class="so-sub">${d.cat} · ★ ${d.rating}</span></span>
      </button>
      <span class="so-price">${rupees(d.price)}</span>
      <button class="so-add" data-id="${d.id}" aria-label="Add ${d.short} to cart">${PLUS_SVG}</button>`;
    li.querySelector('.so-name').append(highlight(d.name, q));
    return li;
  }));
}

function openSearch() {
  if (searchOverlay.classList.contains('open')) return;
  soReturnFocus = document.activeElement;
  closeNotifications();
  soInput.value = state.searchQuery ? searchInput.value : '';
  renderRecent();
  renderResults();
  searchOverlay.classList.add('open');
  searchOverlay.setAttribute('aria-hidden', 'false');
  lockScroll();
  soInput.focus({ preventScroll: true });
}
function closeSearch({ toMenu = false } = {}) {
  if (!searchOverlay.classList.contains('open')) return;
  searchOverlay.classList.remove('open');
  searchOverlay.setAttribute('aria-hidden', 'true');
  unlockScroll();
  if (toMenu) scrollToEl(filterBar);
  else if (soReturnFocus && soReturnFocus !== searchInput && soReturnFocus !== mobileSearchInput) soReturnFocus.focus({ preventScroll: true });
}
// Apply a term to the menu grid, remember it, and jump to the results
function commitSearch(term) {
  handleSearch(term);
  saveRecent(term);
  closeSearch({ toMenu: true });
}

[searchInput, mobileSearchInput].forEach(input => {
  input.addEventListener('focus', openSearch);
  input.addEventListener('click', openSearch);
});
soInput.addEventListener('input', () => { handleSearch(soInput.value); renderResults(); });
$('so-form').addEventListener('submit', e => { e.preventDefault(); commitSearch(soInput.value); });
soClear.addEventListener('click', () => { handleSearch(''); renderResults(); soInput.focus(); });
$('so-back').addEventListener('click', () => closeSearch());
$('so-see-all').addEventListener('click', () => commitSearch(soInput.value));
$('so-recent-clear').addEventListener('click', () => {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* storage unavailable */ }
  renderRecent();
  soInput.focus();
});
searchOverlay.addEventListener('click', e => {
  if (e.target === searchOverlay) { closeSearch(); return; }
  const chip = e.target.closest('.so-chip');
  if (chip) { soInput.value = chip.dataset.q; handleSearch(chip.dataset.q); saveRecent(chip.dataset.q); renderResults(); return; }
  const add = e.target.closest('.so-add');
  if (add) {
    const d = cardData($(add.dataset.id));
    addToCart(d.short, d.price, d.id);
    saveRecent(soInput.value);
    flashAdded(add, CHECK_SVG);
    return;
  }
  const open = e.target.closest('.so-open');
  if (open) {
    saveRecent(soInput.value);
    closeSearch();
    openProduct($(open.dataset.id));
  }
});

/* ═══════ NOTIFICATIONS ═══════ */
const notifBtn   = $('notif-btn');
const notifPanel = $('notif-panel');
function openNotifications() {
  notifPanel.hidden = false;
  notifBtn.setAttribute('aria-expanded', 'true');
  $('notif-dot').classList.add('seen');
}
function closeNotifications() {
  if (notifPanel.hidden) return;
  notifPanel.hidden = true;
  notifBtn.setAttribute('aria-expanded', 'false');
}
notifBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (notifPanel.hidden) openNotifications(); else closeNotifications();
});
document.addEventListener('click', e => {
  if (!notifPanel.hidden && !e.target.closest('.notif-wrap')) closeNotifications();
});

/* ═══════ APPLY FILTERS + SORT ═══════ */
function applyFilters() {
  const cards = Array.from(document.querySelectorAll('.menu-card'));

  // Filter
  let visible = cards.filter(card => {
    const cat       = card.dataset.cat;
    const isPopular = card.dataset.popular === 'true';
    const isNew     = card.dataset.new === 'true';
    const isFav     = state.favourites.has(card.querySelector('.card-fav')?.dataset.id);
    const hasOffer  = !!card.querySelector('.offer-badge');

    const catMatch    = state.activeCategory === 'all' || cat === state.activeCategory;
    const filterMatch = state.activeFilter === 'all'
      ? true
      : state.activeFilter === 'popular' ? isPopular
      : state.activeFilter === 'new'     ? isNew
      : state.activeFilter === 'offer'   ? hasOffer
      : state.activeFilter === 'fav'     ? isFav
      : true;
    const searchMatch = !state.searchQuery || matchesQuery(card, state.searchQuery);

    return catMatch && filterMatch && searchMatch;
  });

  // Sort
  if (state.sortMode === 'price-asc')  visible.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
  if (state.sortMode === 'price-desc') visible.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
  if (state.sortMode === 'rating')     visible.sort((a, b) => parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating));

  const visibleIds = new Set(visible.map(c => c.id));

  cards.forEach(card => {
    if (visibleIds.has(card.id)) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });

  // Re-order DOM (restore original order for "default")
  if (state.sortMode !== 'default') {
    visible.forEach(card => menuGrid.appendChild(card));
  } else {
    originalOrder.forEach(card => menuGrid.appendChild(card));
  }
  menuEmpty.hidden = visible.length > 0;

  // Update count
  itemCountEl.textContent = visible.length + (visible.length === 1 ? ' item' : ' items');

  // Search notice
  if (state.searchQuery) {
    searchNotice.style.display = 'flex';
    searchNoticeText.textContent = `Showing ${visible.length} result${visible.length !== 1 ? 's' : ''} for "${state.searchQuery}"`;
  } else {
    searchNotice.style.display = 'none';
  }
}

/* ═══════ TRENDING CHIPS ═══════ */
document.querySelectorAll('.trend-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    // Highlight chip
    document.querySelectorAll('.trend-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    // Add to cart
    addToCart(chip.dataset.add, chip.dataset.price, chip.dataset.id);
    // Scroll to the item's card
    scrollToEl(document.getElementById(chip.dataset.id) || document.getElementById('menu'));
  });
});

/* ═══════ SCROLL BEHAVIORS ═══════ */
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  backToTop.classList.toggle('visible', y > 400);
  siteHeader.classList.toggle('scrolled', y > 8);
}, { passive: true });

/* Header search shows up (desktop) once the hero search has scrolled away */
const heroSearch = document.querySelector('.hero-search');
if (heroSearch) {
  new IntersectionObserver(([entry]) => {
    // out of view *above* the header (not below the fold)
    siteHeader.classList.toggle('show-search', !entry.isIntersecting && entry.boundingClientRect.top < innerHeight / 2);
  }, { rootMargin: '-84px 0px 0px 0px' }).observe(heroSearch);
}

/* ═══════ BOTTOM NAV (mobile) ═══════ */
function setBottomNav(key) {
  bottomNav.querySelectorAll('.bn-item').forEach(b => b.classList.toggle('active', b.dataset.bn === key));
}
bottomNav.addEventListener('click', e => {
  const item = e.target.closest('.bn-item');
  if (!item) return;
  const key = item.dataset.bn;
  if (key === 'cart') { e.preventDefault(); openCart(); return; }
  if (key === 'fav')  { toggleSaved(); setBottomNav(state.activeFilter === 'fav' ? 'fav' : 'home'); return; }
  if (key === 'home') { e.preventDefault(); scrollToY(0); }
  if (key === 'deals') { e.preventDefault(); scrollToEl(document.getElementById('combos')); }
  setBottomNav(key);
});

/* Highlight nav items for the section in view */
const navLinks = document.querySelectorAll('.nav-link');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.dataset.navKey;
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
    if (state.activeFilter !== 'fav') setBottomNav(id === 'combos' ? 'deals' : 'home');
  });
}, { rootMargin: '-45% 0px -50% 0px' });
// #menu is a zero-height anchor now, so watch the menu section itself for "Menu"
[['menu', document.querySelector('.menu-section')], ['combos', $('combos')], ['about', $('about')]].forEach(([key, el]) => {
  if (!el) return;
  el.dataset.navKey = key;
  sectionObserver.observe(el);
});

backToTop.addEventListener('click', () => scrollToY(0));

/* ═══════ CARD ENTRANCE ANIMATION (IntersectionObserver) ═══════ */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const idx = Array.from(menuGrid.querySelectorAll('.menu-card')).indexOf(entry.target);
      setTimeout(() => {
        entry.target.style.opacity = '';
        entry.target.style.transform = ''; // hand back to CSS so :hover lift works
      }, idx * 70);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.menu-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(28px)';
  card.style.transition = 'opacity 0.42s ease, transform 0.42s ease, box-shadow 0.3s, border-color 0.2s';
  observer.observe(card);
});

/* ═══════ KEYBOARD ESC — close the topmost layer ═══════ */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (searchOverlay.classList.contains('open')) closeSearch();
  else if (productSheet.classList.contains('open')) closeProduct();
  else if (!notifPanel.hidden) { closeNotifications(); notifBtn.focus(); }
  else closeCart();
});

/* ═══════ INIT ═══════ */
renderCart();
console.log('%c🍔 No3 Hangout v3.2 ', 'background:#1a3fa8;color:#FFD600;font-size:1.2rem;font-weight:900;padding:8px 24px;border-radius:8px;letter-spacing:2px;');
