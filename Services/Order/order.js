/**
 * OscoBox — Order Page
 *
 * Reads orders from localStorage key `osco_orders`.
 * Each order shape (written by shopping checkout or seeded below):
 * {
 *   id:        string,          // e.g. "ORD-A3KX91"
 *   date:      string,          // ISO date string
 *   productId: string,          // matches PRODUCTS catalogue
 *   name:      string,
 *   size:      string,          // "Mini" | "Regular" | "Large"
 *   qty:       number,
 *   total:     number,          // in IDR
 *   status:    "pending" | "shipped" | "completed" | "cancelled"
 * }
 */

/* ── Constants ──────────────────────────────────────────────── */
const ORDERS_KEY  = 'osco_orders';
const WA_NUMBER   = '6281210765134'; // Customer service WhatsApp Business
const WA_BASE_URL = `https://wa.me/${WA_NUMBER}`;

const STATUS_CONFIG = {
  pending:   { label: 'Menunggu',  icon: '⏳', cls: 'status--pending'   },
  shipping:  { label: 'Dikirim',   icon: '🚚', cls: 'status--shipping'  },
  completed: { label: 'Selesai',   icon: '✅', cls: 'status--completed' },
  cancelled: { label: 'Dibatalkan',icon: '❌', cls: 'status--cancelled' },
};

const TRACKER_STEPS = ['pending', 'shipping', 'completed'];

/* ── Product images map (matches shopping.js catalogue) ─────── */
const PRODUCT_IMGS = {
  mini:    '../../img/oscobox with background small.png',
  regular: '../../img/oscobox with background medium.png',
  large:   '../../img/oscobox with background large.png',
};

/* ── Helpers ─────────────────────────────────────────────────── */
const formatRp = (n) =>
  `Rp ${Number(n).toLocaleString('id-ID')}`;

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

function genOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'ORD-';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/* ── localStorage helpers ───────────────────────────────────── */
function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function saveOrders(orders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (_) {}
}

/* Seed demo orders if none exist so the page isn't empty on first visit */
function seedDemoOrders() {
  const existing = loadOrders();
  if (existing.length > 0) return;

  const demos = [
    {
      id: genOrderId(),
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      productId: 'regular',
      name: 'Regular Oscobox',
      size: 'Sedang',
      qty: 2,
      total: 80000,
      status: 'completed',
    },
    {
      id: genOrderId(),
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      productId: 'mini',
      name: 'Mini Oscobox',
      size: 'Kecil',
      qty: 1,
      total: 30000,
      status: 'shipping',
    },
  ];
  saveOrders(demos);
}

/* ── State ───────────────────────────────────────────────────── */
let orders     = [];
let activeFilter = 'all';

/* ── DOM refs ────────────────────────────────────────────────── */
const orderList      = document.getElementById('orderList');
const ordersEmpty    = document.getElementById('ordersEmpty');
const tabs           = document.querySelectorAll('.orders-tab');
const countAll       = document.getElementById('countAll');
const countShipping  = document.getElementById('countShipping');
const countCompleted = document.getElementById('countCompleted');
const toast          = document.getElementById('toast');

/* ── Filter logic ────────────────────────────────────────────── */
function filteredOrders() {
  if (activeFilter === 'all')       return orders.filter((o) => o.status !== 'cancelled');
  if (activeFilter === 'shipping')  return orders.filter((o) => o.status === 'shipping');
  if (activeFilter === 'completed') return orders.filter((o) => o.status === 'completed');
  return orders;
}

function updateCounts() {
  countAll.textContent       = orders.filter((o) => o.status !== 'cancelled').length;
  countShipping.textContent  = orders.filter((o) => o.status === 'shipping').length;
  countCompleted.textContent = orders.filter((o) => o.status === 'completed').length;
}

/* ── Tracker progress width ──────────────────────────────────── */
function trackerProgressWidth(status) {
  if (status === 'pending')   return '0%';
  if (status === 'shipping')  return '50%';
  if (status === 'completed') return '100%';
  return '0%';
}

/* ── Status dropdown HTML ─────────────────────────────────────── */
function statusDropdownHTML(orderId, currentStatus) {
  const options = Object.entries(STATUS_CONFIG)
    .filter(([key]) => key !== 'cancelled')
    .map(([key, cfg]) => `
      <button
        type="button"
        class="order-card__status-option${key === currentStatus ? ' is-active' : ''}"
        data-order-id="${orderId}"
        data-new-status="${key}"
      >
        ${cfg.icon} ${cfg.label}
      </button>
    `).join('');

  return `
    <div class="order-card__status-dropdown" id="dropdown-${orderId}">
      ${options}
    </div>
  `;
}

/* ── Render tracker ──────────────────────────────────────────── */
function trackerHTML(status) {
  const stepIndex = TRACKER_STEPS.indexOf(status);

  const steps = TRACKER_STEPS.map((step, i) => {
    const cfg = STATUS_CONFIG[step];
    let cls = '';
    if (i < stepIndex)       cls = 'tracker__step--done';
    else if (i === stepIndex) cls = 'tracker__step--active';
    else                      cls = 'tracker__step--dim';

    const dotContent = i < stepIndex
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>'
      : cfg.icon;

    return `
      <div class="tracker__step ${cls}">
        <div class="tracker__dot">${dotContent}</div>
        <span class="tracker__label">${cfg.label}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="tracker" role="list" aria-label="Status pengiriman">
      <div class="tracker__progress" style="width: ${trackerProgressWidth(status)}"></div>
      ${steps}
    </div>
  `;
}

/* ── Render footer action button ─────────────────────────────── */
function footerActionHTML(order) {
  const waMsg  = encodeURIComponent(`Halo OscoBox! Saya ingin bertanya tentang pesanan ${order.id}.`);
  const waHref = `${WA_BASE_URL}?text=${waMsg}`;

  const waLink = `
    <a
      href="${waHref}"
      class="order-card__wa-link"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp untuk pesanan ${order.id}"
    >
      <svg class="order-card__wa-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      Butuh Bantuan? Chat WhatsApp
    </a>
  `;

  if (order.status === 'completed') {
    return `
      <footer class="order-card__footer">
        ${waLink}
        <a href="../Shopping/shopping.html" class="order-card__action-btn btn-buy-again" aria-label="Beli lagi ${order.name}">
          🔄 Beli Lagi
        </a>
      </footer>
    `;
  }

  if (order.status === 'cancelled') {
    return `
      <footer class="order-card__footer">
        ${waLink}
        <a href="../Shopping/shopping.html" class="order-card__action-btn btn-buy-again" aria-label="Pesan ulang ${order.name}">
          🛒 Pesan Lagi
        </a>
      </footer>
    `;
  }

  // pending or shipping — can still cancel
  return `
    <footer class="order-card__footer">
      ${waLink}
      <button
        type="button"
        class="order-card__action-btn btn-cancel"
        data-cancel-id="${order.id}"
        aria-label="Batalkan pesanan ${order.id}"
      >
        ⚠️ Batalkan Pesanan
      </button>
    </footer>
  `;
}

/* ── Render single order card ────────────────────────────────── */
function renderOrderCard(order) {
  const cfg        = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const imgSrc     = PRODUCT_IMGS[order.productId] || '../../img/oscobox.jpg';
  const showTracker = order.status !== 'cancelled';

  const li = document.createElement('li');
  li.className = 'order-card';
  li.setAttribute('data-order-id', order.id);

  li.innerHTML = `
    <!-- Top bar -->
    <div class="order-card__topbar">
      <div class="order-card__meta">
        <span class="order-card__id">${order.id}</span>
        <span class="order-card__sep">·</span>
        <time datetime="${order.date}">${formatDate(order.date)}</time>
      </div>
      <div class="order-card__status-wrap">
        <button
          type="button"
          class="order-card__status-btn ${cfg.cls}"
          aria-haspopup="listbox"
          aria-expanded="false"
          data-dropdown-id="${order.id}"
          aria-label="Status pesanan: ${cfg.label}. Klik untuk ubah"
        >
          <span class="order-card__status-icon" aria-hidden="true">${cfg.icon}</span>
          ${cfg.label}
          <span aria-hidden="true">▾</span>
        </button>
        ${statusDropdownHTML(order.id, order.status)}
      </div>
    </div>

    <!-- Body -->
    <div class="order-card__body">
      <img
        src="${imgSrc}"
        alt="${order.name}"
        class="order-card__product-img"
        onerror="this.src='../../img/oscobox.jpg'"
        loading="lazy"
      />
      <div class="order-card__product-info">
        <p class="order-card__product-name">${order.name}</p>
        <p class="order-card__product-sub">
          <span class="order-card__product-size">${order.size}</span>
          <span>× ${order.qty}</span>
        </p>
      </div>
      <div class="order-card__total">${formatRp(order.total)}</div>
    </div>

    <!-- Progress tracker (hidden for cancelled) -->
    ${showTracker ? `<div class="order-card__tracker">${trackerHTML(order.status)}</div>` : ''}

    <!-- Footer -->
    ${footerActionHTML(order)}
  `;

  return li;
}

/* ── Render the full order list ──────────────────────────────── */
function renderOrders() {
  orderList.innerHTML = '';
  updateCounts();

  const visible = filteredOrders();

  if (visible.length === 0) {
    ordersEmpty.hidden = false;
    orderList.hidden   = true;
  } else {
    ordersEmpty.hidden = true;
    orderList.hidden   = false;

    visible.forEach((order) => {
      orderList.appendChild(renderOrderCard(order));
    });

    // Status dropdown toggles
    orderList.querySelectorAll('[data-dropdown-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropId = btn.dataset.dropdownId;
        closeAllDropdowns(dropId);
        const dropdown = document.getElementById(`dropdown-${dropId}`);
        if (!dropdown) return;
        const isOpen = dropdown.classList.contains('is-open');
        dropdown.classList.toggle('is-open', !isOpen);
        btn.setAttribute('aria-expanded', String(!isOpen));
      });
    });

    // Status option selection
    orderList.querySelectorAll('[data-new-status]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { orderId, newStatus } = btn.dataset;
        changeStatus(orderId, newStatus);
      });
    });

    // Cancel buttons
    orderList.querySelectorAll('[data-cancel-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        cancelOrder(btn.dataset.cancelId);
      });
    });
  }
}

/* ── Close all open dropdowns (except optionally one) ────────── */
function closeAllDropdowns(exceptId) {
  document.querySelectorAll('.order-card__status-dropdown.is-open').forEach((d) => {
    const id = d.id.replace('dropdown-', '');
    if (id !== exceptId) {
      d.classList.remove('is-open');
      const btn = document.querySelector(`[data-dropdown-id="${id}"]`);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ── Change order status ─────────────────────────────────────── */
function changeStatus(orderId, newStatus) {
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return;

  orders[idx].status = newStatus;
  saveOrders(orders);
  renderOrders();
  showToast(`Status diubah ke ${STATUS_CONFIG[newStatus].label}`);
}

/* ── Cancel order ─────────────────────────────────────────────── */
function cancelOrder(orderId) {
  changeStatus(orderId, 'cancelled');
  showToast('Pesanan dibatalkan.');
}

/* ── Tab switching ───────────────────────────────────────────── */
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => {
      t.classList.remove('orders-tab--active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('orders-tab--active');
    tab.setAttribute('aria-selected', 'true');
    activeFilter = tab.dataset.filter;
    renderOrders();
  });
});

/* ── Close dropdowns on outside click ───────────────────────── */
document.addEventListener('click', () => closeAllDropdowns(null));

/* ── Toast ───────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ── Navbar scroll shadow ────────────────────────────────────── */
(function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── Hamburger ───────────────────────────────────────────────── */
(function initHamburger() {
  const btn  = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  const open  = () => { btn.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');  menu.classList.add('is-open'); menu.removeAttribute('aria-hidden'); };
  const close = () => { btn.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true'); };
  btn.addEventListener('click', () => (btn.classList.contains('is-open') ? close() : open()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) close(); });
})();

/* ── Init ────────────────────────────────────────────────────── */
seedDemoOrders();
orders = loadOrders();
renderOrders();
