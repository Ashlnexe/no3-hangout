/* ──────────────────────────────────────────
   No3 Hangout — Interactive JavaScript v2
   Features: Cart · Search · Filters · Sort ·
   Favourites · Mobile Nav · Back-to-top ·
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
const cartCountEl   = $('cart-count');
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
const hamburger     = $('hamburger');
const mobileNav     = $('mobile-nav');
const browseMenuBtn = $('browse-menu-btn');

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

/* ═══════ MOBILE HAMBURGER ═══════ */
hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(isOpen));
  mobileNav.classList.toggle('open', isOpen);
  mobileNav.setAttribute('aria-hidden', String(!isOpen));
});
// Close on nav link click
document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
  });
});

/* ═══════ CART OPEN / CLOSE ═══════ */
function openCart() {
  cartSidebar.classList.add('open');
  cartSidebar.setAttribute('aria-hidden', 'false');
  cartOverlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartSidebar.classList.remove('open');
  cartSidebar.setAttribute('aria-hidden', 'true');
  cartOverlay.classList.remove('visible');
  document.body.style.overflow = '';
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
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-name">${item.name}</div>
      <div class="cart-qty-wrap">
        <button class="qty-btn" data-id="${item.id}" data-action="dec" aria-label="Decrease qty">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" data-id="${item.id}" data-action="inc" aria-label="Increase qty">+</button>
      </div>
      <div class="cart-item-price">₹${item.price * item.qty}</div>
    `;
    cartItemsEl.appendChild(el);
  });

  // Totals
  const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = state.cart.reduce((s, i) => s + i.qty, 0);
  cartTotalEl.textContent = '₹' + subtotal;
  if (cartGrandEl) cartGrandEl.textContent = '₹' + subtotal;

  // Header sub
  if (cartHeaderSub) {
    cartHeaderSub.textContent = hasItems
      ? `${totalQty} item${totalQty !== 1 ? 's' : ''} · ₹${subtotal}`
      : 'Add items to get started';
  }

  // Cart badge
  cartCountEl.textContent = totalQty;
  cartCountEl.classList.add('bump');
  setTimeout(() => cartCountEl.classList.remove('bump'), 400);
}

/* ═══════ ADD TO CART ═══════ */
function addToCart(name, price, id) {
  const existing = state.cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
    showToast(`+1 ${name} 🎉`);
  } else {
    state.cart.push({ id, name, price: parseInt(price, 10), qty: 1 });
    showToast(`${name} added to cart 🛒`);
  }
  renderCart();
}

/* ═══════ CART QTY (delegated) ═══════ */
cartItemsEl.addEventListener('click', e => {
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
    const name  = btn.dataset.name;
    const price = btn.dataset.price;
    addToCart(name, price, id);

    // Animate button
    const origHTML = btn.innerHTML;
    btn.classList.add('added');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Added!`;
    setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = origHTML; }, 1500);
  });
});

/* ═══════ COMBO ADD BUTTONS ═══════ */
document.querySelectorAll('.combo-add').forEach(btn => {
  btn.addEventListener('click', () => {
    const id    = btn.closest('[id]').id;
    const name  = btn.dataset.name;
    const price = btn.dataset.price;
    addToCart(name, price, id);
    const orig = btn.textContent;
    btn.classList.add('added');
    btn.textContent = '✓ Added';
    setTimeout(() => { btn.classList.remove('added'); btn.textContent = orig; }, 1500);
  });
});

/* ═══════ CHECKOUT ═══════ */
checkoutBtn.addEventListener('click', () => {
  showToast('🎉 Order confirmed! Hang tight…');
  state.cart = [];
  renderCart();
  closeCart();
});

/* ═══════ FAVOURITES ═══════ */
document.querySelectorAll('.card-fav').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    if (state.favourites.has(id)) {
      state.favourites.delete(id);
      btn.classList.remove('active');
      showToast('Removed from favourites');
    } else {
      state.favourites.add(id);
      btn.classList.add('active');
      showToast('Added to favourites ❤️');
    }
  });
});

/* ═══════ CATEGORY FILTER ═══════ */
categoryList.addEventListener('click', e => {
  const btn = e.target.closest('.cat-item');
  if (!btn) return;
  document.querySelectorAll('.cat-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.activeCategory = btn.dataset.cat;
  applyFilters();
});

/* ═══════ PILL FILTER ═══════ */
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.activeFilter = pill.dataset.filter;
    applyFilters();
  });
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
  // Keep both inputs in sync
  if (searchInput.value !== q) searchInput.value = q;
  if (mobileSearchInput && mobileSearchInput.value !== q) mobileSearchInput.value = q;
  applyFilters();
}
searchInput.addEventListener('input', e => handleSearch(e.target.value));
if (mobileSearchInput) mobileSearchInput.addEventListener('input', e => handleSearch(e.target.value));
searchClear.addEventListener('click', () => handleSearch(''));
if (clearSearchBtn) clearSearchBtn.addEventListener('click', () => handleSearch(''));

/* ═══════ APPLY FILTERS + SORT ═══════ */
function applyFilters() {
  const cards = Array.from(document.querySelectorAll('.menu-card'));

  // Filter
  let visible = cards.filter(card => {
    const cat       = card.dataset.cat;
    const isPopular = card.dataset.popular === 'true';
    const isNew     = card.dataset.new === 'true';
    const hasOffer  = !!card.querySelector('.offer-badge');
    const name      = (card.querySelector('.card-name')?.textContent || '').toLowerCase();
    const desc      = (card.querySelector('.card-desc')?.textContent || '').toLowerCase();

    const catMatch    = state.activeCategory === 'all' || cat === state.activeCategory;
    const filterMatch = state.activeFilter === 'all'
      ? true
      : state.activeFilter === 'popular' ? isPopular
      : state.activeFilter === 'new'     ? isNew
      : state.activeFilter === 'offer'   ? hasOffer
      : true;
    const searchMatch = !state.searchQuery
      ? true
      : name.includes(state.searchQuery) || desc.includes(state.searchQuery) || cat.includes(state.searchQuery);

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

  // Re-order DOM by sorting visible cards (optional visual sort)
  if (state.sortMode !== 'default') {
    visible.forEach(card => menuGrid.appendChild(card));
  }

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
    // Scroll to menu
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ═══════ SCROLL BEHAVIORS ═══════ */
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  // Back to top
  backToTop.classList.toggle('visible', y > 400);
}, { passive: true });

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ═══════ CARD ENTRANCE ANIMATION (IntersectionObserver) ═══════ */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const idx = Array.from(menuGrid.querySelectorAll('.menu-card')).indexOf(entry.target);
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, idx * 70);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.menu-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(28px)';
  card.style.transition = 'opacity 0.42s ease, transform 0.42s ease, box-shadow 0.28s, border-color 0.2s';
  observer.observe(card);
});

/* ═══════ KEYBOARD ESC ═══════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCart();
});

/* ═══════ INIT ═══════ */
renderCart();
console.log('%c🍔 No3 Hangout v2 ', 'background:#1a3fa8;color:#FFD600;font-size:1.2rem;font-weight:900;padding:8px 24px;border-radius:8px;letter-spacing:2px;');
