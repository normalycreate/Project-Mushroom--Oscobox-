/* ============================================================
   promo.js — Halaman Promo / Reward Loyalitas OscoBox
   ============================================================ */

'use strict';

/* ----------------------------------------------------------
   1. KODE YANG VALID  (kode → poin yang diberikan)
   ---------------------------------------------------------- */
const VALID_CODES = {
  PROMO2026: 4,
  GREEN10:   3,
  WELCOME5:  2,
  OSCO5:     5,
  REWARD3:   3,
};

/* ----------------------------------------------------------
   2. TINGKAT REWARD  (naik berdasarkan ambang)
   ---------------------------------------------------------- */
const TIERS = [
  { id: 'starter', threshold: 12, label: 'Tier Pemula', pct: '10%' },
  { id: 'silver',  threshold: 15, label: 'Tier Perak',  pct: '15%' },
  { id: 'gold',    threshold: 45, label: 'Tier Emas',    pct: '30%' },
];

/* ----------------------------------------------------------
   3. KEADAAN PERSISTEN  (localStorage)
   ---------------------------------------------------------- */
const STATE_KEY = 'oscobox_promo_state';

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* abaikan */ }
  return { points: 8, usedCodes: [] };   // default: 8 poin
}

function saveState(state) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) { /* abaikan */ }
}

/* ----------------------------------------------------------
   4. REFERENSI DOM
   ---------------------------------------------------------- */
const balanceNum   = document.getElementById('balanceNum');
const balanceUntil = document.getElementById('balanceUntil');
const balanceBar   = document.getElementById('balanceBar');

const codeForm     = document.getElementById('codeForm');
const codeInput    = document.getElementById('codeInput');
const codeMsg      = document.getElementById('codeMsg');
const claimBtn     = document.getElementById('claimBtn');

const keepGoingCard  = document.getElementById('keepGoingCard');
const keepGoingTitle = document.getElementById('keepGoingTitle');
const keepGoingText  = document.getElementById('keepGoingText');
const keepGoingNum   = document.getElementById('keepGoingNum');

const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu   = document.getElementById('mobileMenu');

/* ----------------------------------------------------------
   5. RENDER  — perbarui setiap elemen dari keadaan
   ---------------------------------------------------------- */
function render(state) {
  const { points } = state;

  /* ---- Balance card ---- */
  balanceNum.textContent = points;

  // Cari tier berikutnya yang belum dibuka pengguna
  const nextTier = TIERS.find(t => points < t.threshold);

  if (nextTier) {
    const needed = nextTier.threshold - points;
    balanceUntil.textContent = `${needed} poin hingga voucher ${nextTier.pct}`;
    // Progress bar: isi relatif terhadap ambang tier ini
    const prev = getPrevThreshold(nextTier);
    const progress = Math.min(100, ((points - prev) / (nextTier.threshold - prev)) * 100);
    balanceBar.style.width = `${Math.max(0, progress)}%`;
  } else {
    // Semua tier terbuka
    balanceUntil.textContent = 'Semua voucher terbuka! 🎉';
    balanceBar.style.width = '100%';
  }

  /* ---- Reward tiers ---- */
  TIERS.forEach(tier => {
    const el = document.getElementById(`tier-${tier.id}`);
    if (!el) return;
    if (points >= tier.threshold) {
      el.classList.add('is-unlocked');
      el.setAttribute('aria-label', `${tier.label} — Diskon ${tier.pct} — TERBUKA`);
    } else {
      el.classList.remove('is-unlocked');
      el.setAttribute('aria-label', `${tier.label} — Diskon ${tier.pct}, butuh ${tier.threshold - points} poin lagi`);
    }
  });

  /* ---- Keep Going card ---- */
  if (nextTier) {
    const needed = nextTier.threshold - points;
    const isFirst = nextTier.id === 'starter';

    keepGoingCard.classList.remove('is-unlocked');
    keepGoingTitle.textContent = 'Terus Maju!';
    keepGoingNum.textContent   = `${needed} poin lagi`;

    const suffix = isFirst
      ? 'untuk membuka voucher pertama Anda.'
      : `untuk membuka ${nextTier.label} (${nextTier.pct}).`;

    // Bangun ulang teks keep-going dengan span yang tebal tetap utuh
    keepGoingText.innerHTML = `Anda memerlukan <strong id="keepGoingNum">${needed} poin lagi</strong> ${suffix}`;
  } else {
    keepGoingCard.classList.add('is-unlocked');
    keepGoingTitle.textContent = 'Semua Voucher Terbuka! 🎉';
    keepGoingText.innerHTML    = 'Anda telah mencapai <strong>Tier Emas</strong>. Nikmati diskon 30% Anda!';
  }
}

function getPrevThreshold(tier) {
  const idx = TIERS.indexOf(tier);
  return idx > 0 ? TIERS[idx - 1].threshold : 0;
}

/* ----------------------------------------------------------
   6. LOGIKA KLAIM
   ---------------------------------------------------------- */
function setMsg(text, type /* 'success' | 'error' | '' */) {
  codeMsg.textContent = text;
  codeMsg.className   = `code-form__msg${type ? ` msg--${type}` : ''}`;
}

function setInputState(state /* 'success' | 'error' | '' */) {
  codeInput.classList.remove('is-success', 'is-error');
  if (state) codeInput.classList.add(`is-${state}`);
}

function animateBump(el) {
  el.style.transition = 'transform .15s ease, color .15s';
  el.style.transform  = 'scale(1.25)';
  el.style.color      = '#16a34a';
  setTimeout(() => {
    el.style.transform = 'scale(1)';
  }, 180);
}

codeForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const raw  = codeInput.value.trim();
  const code = raw.toUpperCase();

  /* --- Cek kosong --- */
  if (!code) {
    setMsg('Silakan masukkan kode produk.', 'error');
    setInputState('error');
    codeInput.focus();
    return;
  }

  /* --- Cek panjang (6–12 karakter) --- */
  if (code.length < 6 || code.length > 12) {
    setMsg('Kode harus antara 6 dan 12 karakter.', 'error');
    setInputState('error');
    codeInput.focus();
    return;
  }

  const state = loadState();

  /* --- Sudah digunakan --- */
  if (state.usedCodes.includes(code)) {
    setMsg(`Kode "${code}" sudah pernah digunakan.`, 'error');
    setInputState('error');
    codeInput.focus();
    return;
  }

  /* --- Kode tidak valid --- */
  if (!(code in VALID_CODES)) {
    setMsg('Kode tidak valid. Silakan periksa dan coba lagi.', 'error');
    setInputState('error');
    codeInput.focus();
    return;
  }

  /* --- Sukses --- */
  const pts = VALID_CODES[code];
  state.points    += pts;
  state.usedCodes  = [...state.usedCodes, code];
  saveState(state);

  setMsg(`+${pts} poin ditambahkan! Saldo baru: ${state.points} poin`, 'success');
  setInputState('success');
  animateBump(balanceNum);

  codeInput.value = '';
  render(state);

  // Hapus pesan sukses setelah 4 detik
  setTimeout(() => {
    setMsg('', '');
    setInputState('');
  }, 4000);
});

/* Hapus pesan saat input */
codeInput.addEventListener('input', () => {
  if (codeMsg.textContent) {
    setMsg('', '');
    setInputState('');
  }
});

/* ----------------------------------------------------------
   7. TOMBOL KODE HINT  (isi input saat diklik)
   ---------------------------------------------------------- */
document.querySelectorAll('.hint-code').forEach(btn => {
  btn.addEventListener('click', () => {
    codeInput.value = btn.dataset.code;
    setMsg('', '');
    setInputState('');
    codeInput.focus();
  });
});

/* ----------------------------------------------------------
   8. HAMBURGER MOBILE
   ---------------------------------------------------------- */
hamburgerBtn.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('is-open');
  hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
});

/* Tutup menu mobile saat tautan diklik */
mobileMenu.querySelectorAll('.navbar__mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

/* ----------------------------------------------------------
   9. INIT
   ---------------------------------------------------------- */
(function init() {
  render(loadState());
})();
