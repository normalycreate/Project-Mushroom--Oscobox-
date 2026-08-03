/**
 * OscoBox — Shopping / Store Page
 * Features: product listing, cart sidebar, checkout modal, voucher codes,
 * localStorage persistence, quantity stepper, toast notifications.
 */

/* ── Product catalogue ─────────────────────────────────────── */
const PRODUCTS = [
  {
    id: 'mini',
    name: 'Mini Oscobox',
    size: 'Kecil',
    desc: 'Wadah korporat porsi tunggal yang mengamankan sampel dan mendongkrak skor ESG perusahaan. (Kapasitas 1–2 kg, contoh ukuran 34x25x16 cm)',
    price: 30000,
    reviews: 675,
    img: '../../img/oscobox with background small.png',
  },
  {
    id: 'regular',
    name: 'Regular Oscobox',
    size: 'Sedang',
    desc: 'Wadah berbahan organik untuk menekan limbah dan audit keberlanjutan. (Kapasitas 3–5 kg, contoh ukuran 34x25x30 cm)',
    price: 40000,
    reviews: 312,
    img: '../../img/oscobox with background medium.png',
  },
  {
    id: 'large',
    name: 'Large Oscobox',
    size: 'Besar',
    desc: 'Pasokan masif frozen food untuk mengeliminasi limbah industri demi laporan hijau perusahaan. (Kapasitas di atas 5 kg, contoh ukuran 52x38x34 cm)',
    price: 75000,
    reviews: 95,
    img: '../../img/oscobox with background large.png',
  },
];

/* ── Valid voucher codes (from promo page) ─────────────────── */
const VOUCHER_CODES = {
  'PROMO2026':  0.10,  // 10% discount
  'GREEN10':    0.15,  // 15% discount
  'WELCOME5':   0.30,  // 30% discount
  'EARTH2026':  0.10,  // 10% discount
  'SPRING10':   0.15,  // 15% discount
  'FRESH5':     0.30,  // 30% discount
  'ECOBOX7':    0.10,  // 10% discount
  'PLANET3':    0.15,  // 15% discount
  'OSCO5':      0.10,  // 10% discount
  'REWARD3':    0.15,  // 15% discount
};

/* ── Helpers ─────────────────────────────────────────────── */
const formatRp = (n) =>
  `Rp ${Number(n).toLocaleString('id-ID')}`;

function genOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'ORD-';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/* ── Cart state ──────────────────────────────────────────── */
const CART_KEY = 'osco_cart';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch (_) {
    return {};
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (_) {}
}

let cart = loadCart(); // { productId: qty }

let appliedVoucher = null; // { code, discount }

function cartTotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find((x) => x.id === id);
    return p ? sum + p.price * qty : sum;
  }, 0);
}

function cartItemCount() {
  return Object.values(cart).reduce((sum, q) => sum + q, 0);
}

function calculateDiscount() {
  if (!appliedVoucher) return 0;
  return Math.round(cartTotal() * appliedVoucher.discount);
}

function grandTotal() {
  return cartTotal() - calculateDiscount();
}

/* ── DOM refs ────────────────────────────────────────────── */
const productGrid   = document.getElementById('productGrid');
const cartBtn       = document.getElementById('cartBtn');
const cartBadge     = document.getElementById('cartBadge');
const cartSidebar   = document.getElementById('cartSidebar');
const cartOverlay   = document.getElementById('cartOverlay');
const cartClose     = document.getElementById('cartClose');
const cartBody      = document.getElementById('cartBody');
const cartEmpty     = document.getElementById('cartEmpty');
const cartSubtotal  = document.getElementById('cartSubtotal');
const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
const toast         = document.getElementById('toast');

// Checkout modal refs
const checkoutOverlay     = document.getElementById('checkoutOverlay');
const checkoutModal       = document.getElementById('checkoutModal');
const checkoutClose       = document.getElementById('checkoutClose');
const checkoutSummary     = document.getElementById('checkoutSummary');
const checkoutSubtotal    = document.getElementById('checkoutSubtotal');
const checkoutGrandTotal  = document.getElementById('checkoutGrandTotal');
const btnTotalAmount      = document.getElementById('btnTotalAmount');
const voucherInput        = document.getElementById('voucherInput');
const applyVoucherBtn     = document.getElementById('applyVoucherBtn');
const discountRow         = document.getElementById('discountRow');
const discountAmount      = document.getElementById('discountAmount');
const checkoutForm        = document.getElementById('checkoutForm');
const cardholderName      = document.getElementById('cardholderName');
const cardNumber          = document.getElementById('cardNumber');
const expiryDate          = document.getElementById('expiryDate');
const cvv                 = document.getElementById('cvv');

/* ── Render product grid ────────────────────────────────── */
function renderProducts() {
  productGrid.innerHTML = '';
  PRODUCTS.forEach((product) => {
    const item = document.createElement('li');
    item.className = 'product-card';
    item.innerHTML = `
      <div class="product-card__img-wrap">
        <img
          src="${product.img}"
          alt="${product.name}"
          class="product-card__img"
          loading="lazy"
          onerror="this.src='../../img/oscobox.jpg'"
        />
      </div>
      <div class="product-card__body">
        <h2 class="product-card__name">${product.name}</h2>
        <p class="product-card__desc">${product.desc}</p>
        <div class="product-card__footer">
          <div class="product-card__price-wrap">
            <span class="product-card__price">${formatRp(product.price)}</span>
            <span class="product-card__reviews">${product.reviews} ulasan</span>
          </div>
          <button
            class="btn product-card__add-btn"
            type="button"
            data-product-id="${product.id}"
            aria-label="Tambah ${product.name} ke keranjang"
          >
            + Beli
          </button>
        </div>
      </div>
    `;
    productGrid.appendChild(item);
  });

  // Attach add-to-cart listeners
  productGrid.querySelectorAll('[data-product-id]').forEach((btn) => {
    btn.addEventListener('click', () => addToCart(btn.dataset.productId));
  });
}

/* ── Cart mutations ─────────────────────────────────────── */
function addToCart(productId) {
  cart[productId] = (cart[productId] || 0) + 1;
  saveCart(cart);
  updateCartUI();
  bumpBadge();
  const p = PRODUCTS.find((x) => x.id === productId);
  showToast(`${p.name} ditambahkan ke keranjang!`);
}

function setQty(productId, delta) {
  const next = (cart[productId] || 0) + delta;
  if (next <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = next;
  }
  saveCart(cart);
  updateCartUI();
}

/* ── Cart UI ─────────────────────────────────────────────── */
function updateCartUI() {
  // Badge
  const count = cartItemCount();
  cartBadge.textContent = count;

  // Cart body
  const items = Object.entries(cart).filter(([, qty]) => qty > 0);

  if (items.length === 0) {
    cartBody.innerHTML = '';
    cartEmpty.style.display = 'block';
    cartBody.appendChild(cartEmpty);
  } else {
    cartBody.innerHTML = '';
    items.forEach(([id, qty]) => {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) return;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img
          src="${p.img}"
          alt="${p.name}"
          class="cart-item__img"
          onerror="this.src='../../img/oscobox.jpg'"
        />
        <div class="cart-item__info">
          <div class="cart-item__name">${p.name}</div>
          <div class="cart-item__price">${formatRp(p.price * qty)}</div>
        </div>
        <div class="cart-item__qty">
          <button class="cart-item__qty-btn" type="button" data-action="dec" data-id="${id}" aria-label="Kurangi jumlah">−</button>
          <span class="cart-item__qty-num">${qty}</span>
          <button class="cart-item__qty-btn" type="button" data-action="inc" data-id="${id}" aria-label="Tambah jumlah">+</button>
        </div>
        <button class="cart-item__remove" type="button" data-id="${id}" aria-label="Hapus dari keranjang">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      `;
      cartBody.appendChild(row);
    });

    // Qty / remove listeners
    cartBody.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = btn.dataset.action === 'inc' ? 1 : -1;
        setQty(btn.dataset.id, delta);
      });
    });

    cartBody.querySelectorAll('.cart-item__remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        delete cart[btn.dataset.id];
        saveCart(cart);
        updateCartUI();
      });
    });
  }

  // Subtotal
  cartSubtotal.textContent = formatRp(cartTotal());
}

/* ── Cart sidebar open / close ──────────────────────────── */
function openCart() {
  cartSidebar.classList.add('is-open');
  cartOverlay.classList.add('is-open');
  cartSidebar.removeAttribute('aria-hidden');
  cartOverlay.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartSidebar.classList.remove('is-open');
  cartOverlay.classList.remove('is-open');
  cartSidebar.setAttribute('aria-hidden', 'true');
  cartOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCart();
});

/* ── Badge bump animation ────────────────────────────────── */
function bumpBadge() {
  cartBadge.classList.remove('bump');
  // Trigger reflow to restart animation
  void cartBadge.offsetWidth;
  cartBadge.classList.add('bump');
  setTimeout(() => cartBadge.classList.remove('bump'), 300);
}

/* ── Toast ───────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ── Navbar scroll shadow ────────────────────────────────── */
(function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── Hamburger ───────────────────────────────────────────── */
(function initHamburger() {
  const btn  = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  const open  = () => { btn.classList.add('is-open'); btn.setAttribute('aria-expanded','true');  menu.classList.add('is-open'); menu.removeAttribute('aria-hidden'); };
  const close = () => { btn.classList.remove('is-open'); btn.setAttribute('aria-expanded','false'); menu.classList.remove('is-open'); menu.setAttribute('aria-hidden','true'); };

  btn.addEventListener('click', () => btn.classList.contains('is-open') ? close() : open());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) close(); });
})();

/* ── Checkout modal ──────────────────────────────────────── */
function openCheckout() {
  if (cartItemCount() === 0) {
    showToast('Keranjang Anda kosong!');
    return;
  }

  // Render checkout summary
  checkoutSummary.innerHTML = '';
  Object.entries(cart).forEach(([id, qty]) => {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;

    const div = document.createElement('div');
    div.className = 'checkout-summary__item';
    div.innerHTML = `
      <span class="checkout-summary__item-name">${p.name} × ${qty}</span>
      <span class="checkout-summary__item-price">${formatRp(p.price * qty)}</span>
    `;
    checkoutSummary.appendChild(div);
  });

  updateCheckoutTotals();

  checkoutModal.classList.add('is-open');
  checkoutOverlay.classList.add('is-open');
  checkoutModal.removeAttribute('aria-hidden');
  checkoutOverlay.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
  closeCart(); // Close cart sidebar
}

function closeCheckout() {
  checkoutModal.classList.remove('is-open');
  checkoutOverlay.classList.remove('is-open');
  checkoutModal.setAttribute('aria-hidden', 'true');
  checkoutOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function updateCheckoutTotals() {
  const subtotal = cartTotal();
  const discount = calculateDiscount();
  const total    = grandTotal();

  checkoutSubtotal.textContent     = formatRp(subtotal);
  checkoutGrandTotal.textContent   = formatRp(total);
  btnTotalAmount.textContent       = formatRp(total);

  if (discount > 0) {
    discountRow.style.display = 'flex';
    discountAmount.textContent = `- ${formatRp(discount)}`;
  } else {
    discountRow.style.display = 'none';
  }
}

cartCheckoutBtn.addEventListener('click', openCheckout);
checkoutClose.addEventListener('click', closeCheckout);
checkoutOverlay.addEventListener('click', closeCheckout);

/* ── Voucher code application ───────────────────────────────── */
applyVoucherBtn.addEventListener('click', () => {
  const code = voucherInput.value.trim().toUpperCase();
  if (!code) {
    showToast('Masukkan kode voucher!');
    return;
  }

  if (VOUCHER_CODES[code]) {
    appliedVoucher = { code, discount: VOUCHER_CODES[code] };
    updateCheckoutTotals();
    showToast(`Voucher ${code} diterapkan! Diskon ${Math.round(appliedVoucher.discount * 100)}%`);
    voucherInput.value = '';
  } else {
    showToast('Kode voucher tidak valid!');
  }
});

/* ── Card number formatting ─────────────────────────────────── */
cardNumber.addEventListener('input', (e) => {
  let val = e.target.value.replace(/\s/g, '');
  let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
  e.target.value = formatted;
});

expiryDate.addEventListener('input', (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length >= 2) {
    val = val.slice(0, 2) + '/' + val.slice(2, 4);
  }
  e.target.value = val;
});

cvv.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '');
});

/* ── Complete purchase ──────────────────────────────────────── */
checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Validate form
  if (!cardholderName.value.trim() || !cardNumber.value.trim() || !expiryDate.value.trim() || !cvv.value.trim()) {
    showToast('Harap lengkapi semua field pembayaran!');
    return;
  }

  // Create orders from cart
  const ORDERS_KEY = 'osco_orders';
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch (_) {}

  const now = new Date().toISOString();

  Object.entries(cart).forEach(([productId, qty]) => {
    const p = PRODUCTS.find((x) => x.id === productId);
    if (!p) return;

    const order = {
      id: genOrderId(),
      date: now,
      productId: p.id,
      name: p.name,
      size: p.size,
      qty: qty,
      total: p.price * qty,
      status: 'pending',
    };

    orders.push(order);
  });

  // Save orders
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (_) {}

  // Reset points and mark voucher as used if applied
  if (appliedVoucher) {
    const STATE_KEY = 'oscobox_promo_state';
    try {
      const promoState = JSON.parse(localStorage.getItem(STATE_KEY)) || { points: 0, usedCodes: [] };
      // Reset points to 0
      promoState.points = 0;
      // Mark voucher code as used
      if (!promoState.usedCodes.includes(appliedVoucher.code)) {
        promoState.usedCodes.push(appliedVoucher.code);
      }
      localStorage.setItem(STATE_KEY, JSON.stringify(promoState));
    } catch (_) {}
  }

  // Clear cart
  cart = {};
  saveCart(cart);
  appliedVoucher = null;
  updateCartUI();

  // Reset form
  checkoutForm.reset();
  closeCheckout();

  // Show success and redirect
  showToast('Pembayaran berhasil! Pesanan Anda sedang diproses.');

  setTimeout(() => {
    window.location.href = '../Order/order.html';
  }, 1500);
});

/* ── Init ────────────────────────────────────────────────── */
renderProducts();
updateCartUI();
