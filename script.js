import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, getDoc, 
  increment 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =========================================================
   1. تهيئة مشروع فايربيز (سيف للعطور)
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyBpk0UVLAnHsaTZtSTxMfINOHkuAS8OE9Q",
  authDomain: "seif-perfumes.firebaseapp.com",
  projectId: "seif-perfumes",
  storageBucket: "seif-perfumes.firebasestorage.app",
  messagingSenderId: "464823513051",
  appId: "1:464823513051:web:2ef7412e119dac739981fe",
  measurementId: "G-NW3VJW5BBH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const perfumesCol = collection(db, "perfumes");
const ordersCol = collection(db, "orders");
const settingsDoc = doc(db, "settings", "storeConfig");

/* =========================================================
   2. إدارة حالة التطبيق (المتجر فارغ تماماً ويعتمد على الأدمن)
   ========================================================= */
let products = []; // تم إزالة العطور الثابتة؛ تُجلب تلقائياً من الفايربيز
let cart = loadLocal("seif_cart", []);
let wishlist = loadLocal("seif_wishlist", []);
let currentCategory = "all";
let searchQuery = "";
let currentSort = "featured";
let currentPage = 1;
const PRODUCTS_PER_PAGE = 12;

let currentPfpProduct = null;
let currentPfpSize = 50;
let currentPfpQty = 1;

let activeCoupon = null;
let adminWhatsappNumber = "201101579399";

const SIZE_MULTIPLIERS = {
  30: 0.65,
  50: 1.00,
  100: 1.70
};

/* =========================================================
   3. دوال المساعدة والحفظ المحلي
   ========================================================= */
function saveLocal(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

function loadLocal(key, defaultVal) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}

function formatPrice(num) {
  return `${Number(num || 0).toLocaleString("ar-EG")} ج`;
}

function getProductExactPrice(prod, size = 50) {
  if (!prod) return 0;
  const sz = Number(size);
  if (prod.sizes && prod.sizes[sz] !== undefined && prod.sizes[sz] !== null && Number(prod.sizes[sz]) > 0) {
    return Number(prod.sizes[sz]);
  }
  const base = Number(prod.price || 300);
  return Math.round((base * (SIZE_MULTIPLIERS[sz] || 1)) / 10) * 10;
}

function getProductExactStock(prod, size = 50) {
  if (!prod) return 0;
  const sz = Number(size);
  if (prod.stocks && prod.stocks[sz] !== undefined && prod.stocks[sz] !== null) {
    return Number(prod.stocks[sz]);
  }
  return prod.stock !== undefined ? Number(prod.stock) : 15;
}

/* =========================================================
   4. توليد كروت العطور داخل المتجر
   ========================================================= */
function generateProductCardHtml(p) {
  const isFav = wishlist.some(id => String(id) === String(p.id));
  const price30 = getProductExactPrice(p, 30);
  const catLabel = p.category === "men" ? "رجالي" : p.category === "women" ? "نسائي" : "للجنسين";
  const catBadgeClass = p.category === "women" ? "badge-pink" : p.category === "men" ? "badge-blue" : "badge-gold";

  return `
    <article class="compact-perfume-card" data-id="${p.id}">
      <div class="card-visual-wrap" onclick="openProductPage('${p.id}')">
        ${p.bestseller ? '<span class="card-star-badge">الأكثر مبيعاً 🔥</span>' : ''}
        
        <button type="button" 
                class="card-fav-btn ${isFav ? 'active' : ''}" 
                data-action="wishlist" 
                data-id="${p.id}" 
                title="إضافة للمفضلة">
          ${isFav ? '♥' : '♡'}
        </button>

        <img src="${p.image || 'image/S1.png'}" alt="${escapeHtml(p.name)}" class="card-perfume-img" loading="lazy">
        <span class="card-view-pill">معاينة وتفاصيل 👁️</span>
      </div>

      <div class="card-data-wrap">
        <div class="card-category-row">
          <span class="compact-cat-badge ${catBadgeClass}">${catLabel}</span>
          <span class="card-sim-tag">محاكاة الأصلية ✦</span>
        </div>

        <h3 class="card-perfume-name" onclick="openProductPage('${p.id}')">${escapeHtml(p.name)}</h3>
        <p class="card-notes-brief">${escapeHtml(p.notes || "توليفة عطرية مركزة وثابتة تدوم طويلاً")}</p>

        <div class="card-action-footer">
          <div class="card-price-stack">
            <span class="price-from-txt">يبدأ من (30مل):</span>
            <strong class="card-price-val">${formatPrice(price30)}</strong>
          </div>

          <button type="button" 
                  class="card-quick-buy-btn" 
                  data-action="quick-buy" 
                  data-id="${p.id}">
            <span>شراء ⚡</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   5. الفلترة، العرض، والصفحات
   ========================================================= */
function getFilteredCatalog() {
  let list = [...products];

  if (currentCategory !== "all") {
    if (currentCategory === "bestseller") {
      list = list.filter(p => p.bestseller === true);
    } else if (currentCategory === "wishlist") {
      list = list.filter(p => wishlist.map(String).includes(String(p.id)));
    } else if (currentCategory === "men") {
      list = list.filter(p => p.category === "men" || p.category === "unisex");
    } else if (currentCategory === "women") {
      list = list.filter(p => p.category === "women" || p.category === "unisex");
    } else if (currentCategory === "unisex") {
      list = list.filter(p => p.category === "unisex");
    }
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  }

  switch (currentSort) {
    case "price-low":
      list.sort((a, b) => getProductExactPrice(a, 50) - getProductExactPrice(b, 50));
      break;
    case "price-high":
      list.sort((a, b) => getProductExactPrice(b, 50) - getProductExactPrice(a, 50));
      break;
    case "name":
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      break;
    default:
      list.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
  }

  return list;
}

function renderCatalog() {
  const grid = document.getElementById("productsGrid");
  const noProds = document.getElementById("noProducts");
  const womenBanner = document.getElementById("womenNoticeBanner");

  if (womenBanner) {
    womenBanner.style.display = (currentCategory === "women") ? "block" : "none";
  }

  const list = getFilteredCatalog();
  const totalPages = Math.ceil(list.length / PRODUCTS_PER_PAGE);

  if (currentPage > totalPages && totalPages > 0) currentPage = 1;

  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginated = list.slice(start, start + PRODUCTS_PER_PAGE);

  if (grid) {
    grid.innerHTML = paginated.map(generateProductCardHtml).join("");
  }

  if (list.length === 0) {
    if (noProds) noProds.style.display = "block";
    renderPagination(0);
  } else {
    if (noProds) noProds.style.display = "none";
    renderPagination(totalPages);
  }
}

function renderPagination(totalPages) {
  const container = document.getElementById("pagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button type="button" class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  container.innerHTML = html;
  container.querySelectorAll(".page-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.page);
      renderCatalog();
      document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

window.filterByQuick = function(cat) {
  currentCategory = cat;
  currentPage = 1;
  document.querySelectorAll(".capsule-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.category === cat);
  });
  renderCatalog();
  document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
};

window.resetFilters = function() {
  currentCategory = "all";
  searchQuery = "";
  const input = document.getElementById("globalSearchInput");
  if (input) input.value = "";
  filterByQuick("all");
};

/* =========================================================
   6. صفحة تفاصيل العطر (Product Page Overlay)
   ========================================================= */
const productPage = document.getElementById("productPage");

window.openProductPage = function(id) {
  const prod = products.find(p => String(p.id) === String(id));
  if (!prod || !productPage) return;

  currentPfpProduct = prod;
  currentPfpSize = 50;
  currentPfpQty = 1;

  const pfpImage = document.getElementById("pfpImage");
  const pfpName = document.getElementById("pfpName");
  const pfpNotesSummary = document.getElementById("pfpNotesSummary");
  const pfpDesc = document.getElementById("pfpDesc");
  const pfpCategory = document.getElementById("pfpCategory");
  const pfpWomenNotice = document.getElementById("pfpWomenNotice");

  if (pfpImage) pfpImage.src = prod.image || "image/S1.png";
  if (pfpName) pfpName.textContent = prod.name;
  if (pfpNotesSummary) pfpNotesSummary.textContent = prod.notes || "عطر فاخر يحاكي الأصلي بدقة وثبات";
  if (pfpDesc) pfpDesc.textContent = prod.desc || "تم تصنيع وتركيب هذا العطر باستخدام أنقى الزيوت العطرية لضمان ثبات يتخطى 48 ساعة.";
  if (pfpCategory) pfpCategory.textContent = prod.category === "men" ? "رجالي" : prod.category === "women" ? "نسائي" : "للجنسين";

  if (pfpWomenNotice) {
    pfpWomenNotice.style.display = (prod.category === "women") ? "block" : "none";
  }

  document.querySelectorAll("#pfpSizesGroup .size-choice-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.size === "50");
  });

  updatePfpInterface();
  renderRelatedPerfumes(prod);

  productPage.style.display = "block";
  document.body.classList.add("no-scroll");
  productPage.scrollTop = 0;
};

window.closeProductPage = function() {
  if (productPage) {
    productPage.style.display = "none";
    document.body.classList.remove("no-scroll");
    currentPfpProduct = null;
  }
};

document.getElementById("closeProductPageBtn")?.addEventListener("click", closeProductPage);

document.getElementById("pfpSizesGroup")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".size-choice-btn");
  if (!btn || !currentPfpProduct) return;

  document.querySelectorAll("#pfpSizesGroup .size-choice-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  currentPfpSize = Number(btn.dataset.size);
  const maxAvail = getProductExactStock(currentPfpProduct, currentPfpSize);
  currentPfpQty = maxAvail > 0 ? 1 : 0;
  
  updatePfpInterface();
});

document.getElementById("pfpQtyMinus")?.addEventListener("click", () => {
  if (currentPfpQty > 1) {
    currentPfpQty--;
    updatePfpInterface();
  }
});

document.getElementById("pfpQtyPlus")?.addEventListener("click", () => {
  if (!currentPfpProduct) return;
  const maxAvail = getProductExactStock(currentPfpProduct, currentPfpSize);

  if (currentPfpQty >= maxAvail) {
    showToast("المخزون المتاح", `المتوفر من هذا الحجم هو ${maxAvail} زجاجات فقط ⚠️`);
    return;
  }

  currentPfpQty++;
  updatePfpInterface();
});

function updatePfpInterface() {
  if (!currentPfpProduct) return;

  const unitPrice = getProductExactPrice(currentPfpProduct, currentPfpSize);
  const totalPrice = unitPrice * Math.max(1, currentPfpQty);
  const availableStock = getProductExactStock(currentPfpProduct, currentPfpSize);

  const pfpFinalPrice = document.getElementById("pfpFinalPrice");
  const pfpQtyVal = document.getElementById("pfpQtyVal");
  const pfpStockPill = document.getElementById("pfpStockPill");
  const pfpAddBtn = document.getElementById("pfpAddBtn");
  const pfpBuyNowBtn = document.getElementById("pfpBuyNowBtn");

  if (pfpFinalPrice) pfpFinalPrice.textContent = formatPrice(totalPrice);
  if (pfpQtyVal) pfpQtyVal.textContent = currentPfpQty;

  if (pfpStockPill) {
    if (availableStock <= 0) {
      pfpStockPill.textContent = "نفدت الكمية ❌";
      pfpStockPill.style.color = "#e74c3c";
    } else {
      pfpStockPill.textContent = `المتوفر: ${availableStock} زجاجة`;
      pfpStockPill.style.color = "var(--accent-gold)";
    }
  }

  const isOutOfStock = availableStock <= 0;
  if (pfpAddBtn) pfpAddBtn.disabled = isOutOfStock;
  if (pfpBuyNowBtn) pfpBuyNowBtn.disabled = isOutOfStock;
}

document.getElementById("pfpAddBtn")?.addEventListener("click", () => {
  if (!currentPfpProduct) return;
  addToCart(currentPfpProduct.id, currentPfpQty, currentPfpSize);
  showToast("تمت الإضافة للسلة 🛍️", `${currentPfpProduct.name} (${currentPfpSize} مل)`);
});

document.getElementById("pfpBuyNowBtn")?.addEventListener("click", () => {
  if (!currentPfpProduct) return;
  addToCart(currentPfpProduct.id, currentPfpQty, currentPfpSize);
  closeProductPage();
  openCheckout();
});

function renderRelatedPerfumes(mainProduct) {
  const grid = document.getElementById("pfpRelatedGrid");
  if (!grid) return;

  let related = products.filter(p => p.category === mainProduct.category && String(p.id) !== String(mainProduct.id));
  if (related.length === 0) {
    related = products.filter(p => String(p.id) !== String(mainProduct.id));
  }

  grid.innerHTML = related.slice(0, 4).map(generateProductCardHtml).join("");
}

/* =========================================================
   7. صفحة السلة (Cart Page Overlay)
   ========================================================= */
const cartPage = document.getElementById("cartPage");

window.openCart = function() {
  closeProductPage();
  closeCheckout();
  updateCartInterface();
  if (cartPage) {
    cartPage.style.display = "block";
    document.body.classList.add("no-scroll");
    cartPage.scrollTop = 0;
  }
};

window.closeCart = function() {
  if (cartPage) {
    cartPage.style.display = "none";
    document.body.classList.remove("no-scroll");
  }
};

document.getElementById("closeCartPageBtn")?.addEventListener("click", closeCart);
document.getElementById("cartHeaderBtn")?.addEventListener("click", openCart);

function addToCart(id, qty = 1, size = 50) {
  const prod = products.find(p => String(p.id) === String(id));
  if (!prod) return;

  const sz = Number(size);
  const maxStock = getProductExactStock(prod, sz);
  if (maxStock <= 0) {
    showToast("نفدت الكمية", `عذراً، حجم (${sz} مل) غير متوفر حالياً ❌`);
    return;
  }

  const existing = cart.find(i => String(i.id) === String(id) && Number(i.size) === sz);

  if (existing) {
    if (existing.quantity + qty > maxStock) {
      existing.quantity = maxStock;
      showToast("المخزون المتاح", `الكمية المتاحة هي ${maxStock} وتم ضبطها بسلتك ⚠️`);
    } else {
      existing.quantity += qty;
    }
  } else {
    cart.push({
      id: prod.id,
      size: sz,
      quantity: Math.min(qty, maxStock)
    });
  }

  saveLocal("seif_cart", cart);
  updateBadges();
}

function updateCartInterface() {
  const listEl = document.getElementById("cartItemsList");
  const subtotalEl = document.getElementById("cartSubtotalAmount");
  const finalEl = document.getElementById("cartFinalAmount");
  const giftsEl = document.getElementById("cartGiftsAmount");
  const discountRow = document.getElementById("cartDiscountRow");
  const discountVal = document.getElementById("cartDiscountAmount");

  if (!listEl) return;

  if (cart.length === 0) {
    listEl.innerHTML = `
      <div class="cart-empty-panel">
        <div class="empty-icon">🛒</div>
        <h3>سلة مشترياتك فارغة حالياً</h3>
        <p>اختر عطرك المفضل لتحصل على تستر 5 مل هدية مجانية مع كل زجاجة.</p>
        <button type="button" class="btn-primary-glow" onclick="closeCart(); document.getElementById('catalog').scrollIntoView({behavior:'smooth'});">تصفح العطور الآن</button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = "0 ج";
    if (finalEl) finalEl.textContent = "0 ج";
    if (giftsEl) giftsEl.textContent = "0 تسترات هدية";
    return;
  }

  let subtotal = 0;
  let totalBottles = 0;

  listEl.innerHTML = cart.map(item => {
    const prod = products.find(p => String(p.id) === String(item.id));
    if (!prod) return "";

    const sz = Number(item.size || 50);
    const unitPrice = getProductExactPrice(prod, sz);
    const itemTotal = unitPrice * item.quantity;

    subtotal += itemTotal;
    totalBottles += Number(item.quantity || 1);

    return `
      <div class="cart-item-card">
        <img src="${prod.image || 'image/S1.png'}" alt="${escapeHtml(prod.name)}" class="cart-item-img">
        
        <div class="cart-item-details">
          <div class="item-title-row">
            <h4>${escapeHtml(prod.name)}</h4>
            <button type="button" class="btn-remove-item" onclick="removeCartItem('${prod.id}', ${sz})">&times;</button>
          </div>

          <span class="cart-item-size-badge">حجم العبوة: <strong>${sz} مل</strong></span>
          <span class="cart-item-gift-tag">🎁 يشمل تستر 5 مل مجاناً</span>

          <div class="cart-item-bottom-row">
            <div class="cart-qty-picker">
              <button type="button" onclick="modifyCartQty('${prod.id}', ${sz}, -1)">−</button>
              <span>${item.quantity}</span>
              <button type="button" onclick="modifyCartQty('${prod.id}', ${sz}, 1)">+</button>
            </div>
            
            <div class="cart-price-sum">
              <span class="unit-p">السعر: ${formatPrice(unitPrice)}</span>
              <strong class="total-p">${formatPrice(itemTotal)}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  let discount = 0;
  if (activeCoupon && activeCoupon.type === "percent") {
    discount = Math.round(subtotal * (activeCoupon.value / 100));
  }

  const finalTotal = Math.max(0, subtotal - discount);

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (finalEl) finalEl.textContent = formatPrice(finalTotal);
  if (giftsEl) giftsEl.textContent = `${totalBottles} تسترات هدية 🎁`;

  if (discountRow && discountVal) {
    if (discount > 0) {
      discountRow.style.display = "flex";
      discountVal.textContent = `- ${formatPrice(discount)}`;
    } else {
      discountRow.style.display = "none";
    }
  }
}

window.modifyCartQty = function(id, size, change) {
  const item = cart.find(i => String(i.id) === String(id) && Number(i.size) === Number(size));
  if (!item) return;

  const prod = products.find(p => String(p.id) === String(id));
  const maxStock = getProductExactStock(prod, size);

  if (change > 0 && item.quantity + change > maxStock) {
    showToast("المخزون المتاح", `المتبقي من هذا الحجم بالمخزن هو ${maxStock} فقط ⚠️`);
    return;
  }

  item.quantity += change;
  if (item.quantity <= 0) {
    removeCartItem(id, size);
    return;
  }

  saveLocal("seif_cart", cart);
  updateBadges();
  updateCartInterface();
};

window.removeCartItem = function(id, size) {
  cart = cart.filter(i => !(String(i.id) === String(id) && Number(i.size) === Number(size)));
  saveLocal("seif_cart", cart);
  updateBadges();
  updateCartInterface();
  showToast("تم الحذف", "تمت إزالة العطر من السلة.");
};

document.getElementById("proceedCheckoutBtn")?.addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("السلة فارغة", "أضف عطوراً أولاً للمتابعة.");
    return;
  }
  closeCart();
  openCheckout();
});

/* =========================================================
   8. صفحة إتمام الشراء والتوصيل (Checkout Page Overlay)
   ========================================================= */
const checkoutPage = document.getElementById("checkoutPage");
const custGovSelect = document.getElementById("custGov");
const checkoutOrderForm = document.getElementById("checkoutOrderForm");

let GOVERNORATES = [
  { name: "القاهرة", fee: 45 }, { name: "الجيزة", fee: 45 }, { name: "الإسكندرية", fee: 55 },
  { name: "القليوبية", fee: 50 }, { name: "الغربية", fee: 55 }, { name: "المنوفية", fee: 55 },
  { name: "الشرقية", fee: 55 }, { name: "الدقهلية", fee: 55 }, { name: "البحيرة", fee: 60 },
  { name: "كفر الشيخ", fee: 60 }, { name: "دمياط", fee: 60 }, { name: "بورسعيد", fee: 60 },
  { name: "الإسماعيلية", fee: 60 }, { name: "السويس", fee: 60 }, { name: "الفيوم", fee: 65 },
  { name: "بني سويف", fee: 70 }, { name: "المنيا", fee: 75 }, { name: "أسيوط", fee: 80 },
  { name: "سوهاج", fee: 85 }, { name: "قنا", fee: 90 }, { name: "الأقصر", fee: 95 },
  { name: "أسوان", fee: 95 }, { name: "البحر الأحمر", fee: 100 }, { name: "مطروح", fee: 90 },
  { name: "الوادي الجديد", fee: 100 }, { name: "شمال سيناء", fee: 110 }, { name: "جنوب سيناء", fee: 110 }
];

function populateGovs() {
  if (!custGovSelect) return;
  const curr = custGovSelect.value;
  custGovSelect.innerHTML = '<option value="" disabled selected>اختر المحافظة لحساب تكلفة الشحن بدقة</option>';
  GOVERNORATES.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.name;
    opt.textContent = `${g.name} (${g.fee} ج)`;
    if (g.name === curr) opt.selected = true;
    custGovSelect.appendChild(opt);
  });
}
populateGovs();

window.openCheckout = function() {
  if (cart.length === 0) {
    showToast("السلة فارغة", "أضف عطوراً أولاً لإتمام الشراء.");
    return;
  }
  closeProductPage();
  closeCart();
  populateGovs();
  autoFillCustomerData();
  updateCheckoutReview();

  if (checkoutPage) {
    checkoutPage.style.display = "block";
    document.body.classList.add("no-scroll");
    checkoutPage.scrollTop = 0;
  }
};

window.closeCheckout = function() {
  if (checkoutPage) {
    checkoutPage.style.display = "none";
    document.body.classList.remove("no-scroll");
  }
};

document.getElementById("closeCheckoutPageBtn")?.addEventListener("click", () => {
  closeCheckout();
  openCart();
});

function autoFillCustomerData() {
  const saved = loadLocal("seif_customer_data", null);
  if (!saved) return;
  if (saved.name) document.getElementById("custName").value = saved.name;
  if (saved.phone) document.getElementById("custPhone").value = saved.phone;
  if (saved.phone2) document.getElementById("custPhone2").value = saved.phone2;
  if (saved.gov && custGovSelect) custGovSelect.value = saved.gov;
  if (saved.address) document.getElementById("custAddress").value = saved.address;
}

["custName", "custPhone", "custPhone2", "custGov", "custAddress"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", () => {
    saveLocal("seif_customer_data", {
      name: document.getElementById("custName")?.value.trim(),
      phone: document.getElementById("custPhone")?.value.trim(),
      phone2: document.getElementById("custPhone2")?.value.trim(),
      gov: document.getElementById("custGov")?.value,
      address: document.getElementById("custAddress")?.value.trim()
    });
    updateCheckoutReview();
  });
});

custGovSelect?.addEventListener("change", updateCheckoutReview);

function getShippingCost(subtotal) {
  if (subtotal >= 1500) return 0;
  const selGov = GOVERNORATES.find(g => g.name === custGovSelect?.value);
  return selGov ? selGov.fee : 0;
}

function updateCheckoutReview() {
  const previewList = document.getElementById("checkoutOrderItemsList");
  const subtotalEl = document.getElementById("checkoutSubtotal");
  const shippingEl = document.getElementById("checkoutShippingVal");
  const grandEl = document.getElementById("checkoutGrandTotal");
  const giftsEl = document.getElementById("checkoutGiftsVal");
  const discountRow = document.getElementById("checkoutDiscountLine");
  const discountVal = document.getElementById("checkoutDiscountVal");

  let subtotal = 0;
  let totalBottles = 0;

  if (previewList) {
    previewList.innerHTML = cart.map(item => {
      const prod = products.find(p => String(p.id) === String(item.id));
      if (!prod) return "";
      const sz = Number(item.size || 50);
      const uPrice = getProductExactPrice(prod, sz);
      const total = uPrice * item.quantity;
      subtotal += total;
      totalBottles += Number(item.quantity || 1);

      return `
        <div class="preview-item-row">
          <div class="name-sz">
            <strong>${escapeHtml(prod.name)}</strong>
            <span>عبوة ${sz} مل × ${item.quantity}</span>
          </div>
          <span class="price-val">${formatPrice(total)}</span>
        </div>
      `;
    }).join("");
  }

  let discount = 0;
  if (activeCoupon && activeCoupon.type === "percent") {
    discount = Math.round(subtotal * (activeCoupon.value / 100));
  }

  const shipping = getShippingCost(subtotal);
  const grandTotal = Math.max(0, subtotal - discount) + shipping;

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (giftsEl) giftsEl.textContent = `${totalBottles} عينات تستر مجانية 🎁`;

  if (shippingEl) {
    if (!custGovSelect?.value) {
      shippingEl.textContent = "حدد المحافظة";
    } else if (subtotal >= 1500) {
      shippingEl.textContent = "مجاني 🔥";
      shippingEl.style.color = "#2ecc71";
    } else {
      shippingEl.textContent = `${shipping} ج`;
    }
  }

  if (discountRow && discountVal) {
    if (discount > 0) {
      discountRow.style.display = "flex";
      discountVal.textContent = `- ${formatPrice(discount)}`;
    } else {
      discountRow.style.display = "none";
    }
  }

  if (grandEl) grandEl.textContent = formatPrice(grandTotal);
}

document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
  radio.addEventListener("change", (e) => {
    const box = document.getElementById("walletTransferBox");
    if (box) {
      box.style.display = (e.target.value === "vodafone_cash" || e.target.value === "instapay") ? "block" : "none";
    }
  });
});

document.getElementById("copyWalletBtn")?.addEventListener("click", () => {
  const num = document.getElementById("seifWalletNumber")?.textContent || "01101579399";
  navigator.clipboard.writeText(num).then(() => {
    showToast("تم النسخ بنجاح 📋", `تم نسخ رقم التحويل: ${num}`);
  });
});

document.getElementById("btnLocationGps")?.addEventListener("click", () => {
  const status = document.getElementById("locationGpsStatus");
  const hiddenLink = document.getElementById("custLocationMapLink");

  if (!navigator.geolocation) {
    if (status) status.textContent = "المتصفح لا يدعم تحديد الموقع التلقائي.";
    return;
  }

  if (status) status.textContent = "جاري التقاط إحداثيات موقعك... ⏳";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      if (hiddenLink) hiddenLink.value = link;
      if (status) {
        status.textContent = "✓ تم التقاط موقعك الجغرافي بنجاح.";
        status.style.color = "#2ecc71";
      }
    },
    () => {
      if (status) {
        status.textContent = "تعذر تحديد الموقع، اكتب العنوان يدوياً.";
        status.style.color = "#e74c3c";
      }
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

checkoutOrderForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const phone2 = document.getElementById("custPhone2").value.trim();
  const gov = custGovSelect.value;
  const address = document.getElementById("custAddress").value.trim();
  const mapLink = document.getElementById("custLocationMapLink").value;
  const payMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "cod";

  if (!/^01[0125][0-9]{8}$/.test(phone)) {
    alert("رقم الهاتف غير صحيح! يجب أن يتكون من 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015.");
    return;
  }

  const submitBtn = document.getElementById("confirmOrderBtn");
  if (submitBtn) submitBtn.disabled = true;

  let subtotal = 0;
  let totalBottles = 0;
  const orderItemsData = cart.map(item => {
    const prod = products.find(p => String(p.id) === String(item.id));
    const sz = Number(item.size || 50);
    const uPrice = getProductExactPrice(prod, sz);
    const itemTotal = uPrice * item.quantity;
    subtotal += itemTotal;
    totalBottles += Number(item.quantity || 1);

    return {
      id: prod ? prod.id : item.id,
      name: prod ? prod.name : "عطر",
      size: `${sz} مل`,
      quantity: item.quantity,
      price: uPrice,
      total: itemTotal
    };
  });

  const shipping = getShippingCost(subtotal);
  let discount = 0;
  if (activeCoupon && activeCoupon.type === "percent") {
    discount = Math.round(subtotal * (activeCoupon.value / 100));
  }
  const grandTotal = Math.max(0, subtotal - discount) + shipping;

  const itemsListText = orderItemsData.map(i => `• ${i.name} (${i.size}) × ${i.quantity} — ${i.total} ج`).join("\n");

  const waInvoiceMessage = `*طلب جديد — سيف للعطور* 💎
━━━━━━━━━━━━━━━━━━
👤 *المستلم:* ${name}
📱 *الهاتف:* ${phone} ${phone2 ? `| ${phone2}` : ''}
📍 *العنوان:* ${gov} - ${address}
${mapLink ? `🗺️ *الخريطة:* ${mapLink}\n` : ''}
📦 *الطلبات:*
${itemsListText}
🎁 *الهدايا:* (${totalBottles}) تسترات 5 مل مجاناً

💰 *الإجمالي المطلوب:* *${grandTotal} جنيه*
💳 *طريقة الدفع:* ${payMethod === 'cod' ? 'عند الاستلام' : payMethod}
━━━━━━━━━━━━━━━━━━`;

  try {
    await addDoc(ordersCol, {
      customer: { name, phone, phone2: phone2 || "", governorate: gov, address, mapLink },
      items: orderItemsData,
      pricing: { subtotal, discount, shippingFee: shipping, total: grandTotal },
      paymentMethod: payMethod,
      createdAt: new Date()
    });

    for (const item of cart) {
      try {
        const prodRef = doc(db, "perfumes", String(item.id));
        const sz = Number(item.size || 50);
        await updateDoc(prodRef, {
          [`stocks.${sz}`]: increment(-Number(item.quantity || 1)),
          stock: increment(-Number(item.quantity || 1))
        });
      } catch (err) {}
    }

    cart = [];
    saveLocal("seif_cart", cart);
    updateBadges();
    closeCheckout();
    checkoutOrderForm.reset();

    showToast("تم تأكيد طلبك بنجاح! 🎉", "جاري توجيهك إلى واتساب لإرسال الفاتورة...");

    const waUrl = `https://wa.me/${adminWhatsappNumber}?text=${encodeURIComponent(waInvoiceMessage)}`;
    setTimeout(() => {
      window.open(waUrl, "_blank");
    }, 1000);

  } catch (err) {
    alert("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

/* =========================================================
   9. المفضلة، البحث والتوست
   ========================================================= */
function updateBadges() {
  const cartBadge = document.getElementById("cartCountBadge");
  const wishBadge = document.getElementById("wishlistCountBadge");

  const totalCartCount = cart.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
  if (cartBadge) cartBadge.textContent = totalCartCount;
  if (wishBadge) wishBadge.textContent = wishlist.length;
}

function toggleWishlist(id) {
  const strId = String(id);
  const exists = wishlist.some(i => String(i) === strId);

  if (exists) {
    wishlist = wishlist.filter(i => String(i) !== strId);
    showToast("المفضلة", "تمت إزالة العطر من المفضلة.");
  } else {
    wishlist.push(id);
    showToast("المفضلة ♥", "تمت إضافة العطر إلى أمنياتك.");
  }

  saveLocal("seif_wishlist", wishlist);
  updateBadges();
  renderCatalog();
}

document.getElementById("wishlistHeaderBtn")?.addEventListener("click", () => {
  filterByQuick("wishlist");
});

document.addEventListener("click", (e) => {
  const favBtn = e.target.closest('[data-action="wishlist"]');
  if (favBtn) {
    e.stopPropagation();
    toggleWishlist(favBtn.dataset.id);
    return;
  }

  const quickBuyBtn = e.target.closest('[data-action="quick-buy"]');
  if (quickBuyBtn) {
    e.stopPropagation();
    addToCart(quickBuyBtn.dataset.id, 1, 50);
    openCheckout();
    return;
  }
});

// شريط البحث المنسدل
const searchDrawer = document.getElementById("searchDrawer");
const searchInput = document.getElementById("globalSearchInput");

document.getElementById("searchToggleBtn")?.addEventListener("click", () => {
  if (searchDrawer) {
    searchDrawer.classList.toggle("open");
    if (searchDrawer.classList.contains("open")) {
      setTimeout(() => searchInput?.focus(), 200);
    }
  }
});

document.getElementById("searchCloseBtn")?.addEventListener("click", () => {
  if (searchDrawer) searchDrawer.classList.remove("open");
});

searchInput?.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  currentPage = 1;
  renderCatalog();
});

// التجميع للفئات والترتيب
document.getElementById("categoryTabs")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".capsule-btn");
  if (!btn) return;
  document.querySelectorAll(".capsule-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentCategory = btn.dataset.category;
  currentPage = 1;
  renderCatalog();
});

document.getElementById("sortSelect")?.addEventListener("change", (e) => {
  currentSort = e.target.value;
  currentPage = 1;
  renderCatalog();
});

let toastTimer = null;
function showToast(title, msg) {
  const toast = document.getElementById("toast");
  const tTitle = document.getElementById("toastTitle");
  const tText = document.getElementById("toastText");
  if (!toast) return;

  if (tTitle) tTitle.textContent = title;
  if (tText) tText.textContent = msg;

  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

document.getElementById("applyCouponBtn")?.addEventListener("click", async () => {
  const inp = document.getElementById("couponCodeInput");
  const msg = document.getElementById("couponStatusMsg");
  const code = inp ? inp.value.trim().toUpperCase() : "";

  if (!msg) return;
  if (!code) {
    msg.style.display = "block";
    msg.style.color = "#e74c3c";
    msg.textContent = "يرجى إدخال كود الخصم أولاً!";
    return;
  }

  try {
    const snap = await getDoc(doc(db, "coupons", code));
    if (snap.exists() && snap.data().active) {
      activeCoupon = snap.data();
      msg.style.display = "block";
      msg.style.color = "#2ecc71";
      msg.textContent = `✓ تم تطبيق خصم (${activeCoupon.value}%) بنجاح!`;
      updateCartInterface();
    } else {
      activeCoupon = null;
      msg.style.display = "block";
      msg.style.color = "#e74c3c";
      msg.textContent = "عذراً، الكود غير صالح!";
      updateCartInterface();
    }
  } catch (err) {
    msg.style.display = "block";
    msg.style.color = "#e74c3c";
    msg.textContent = "تعذر فحص الكوبون.";
  }
});

/* =========================================================
   10. المزامنة الحية مع فايربيز Firestore
   ========================================================= */
onSnapshot(perfumesCol, (snapshot) => {
  const firebaseList = [];
  snapshot.forEach(d => {
    const data = d.data();
    firebaseList.push({
      id: d.id,
      name: data.name,
      category: data.category || "unisex",
      price: Number(data.price || 300),
      sizes: data.sizes || null,
      stocks: data.stocks || null,
      stock: data.stock !== undefined ? Number(data.stock) : 15,
      bestseller: data.bestseller === true,
      desc: data.desc || "",
      notes: data.notes || "توليفة عطرية مركزة ومحاكاة دقيقة للأصلية",
      image: data.image || "image/S1.png"
    });
  });

  products = firebaseList;
  renderCatalog();
});

onSnapshot(settingsDoc, (snap) => {
  if (snap.exists()) {
    const d = snap.data();
    if (d.whatsappNumber) {
      let clean = String(d.whatsappNumber).replace(/\D/g, "");
      if (clean.startsWith("0")) clean = "2" + clean;
      adminWhatsappNumber = clean;
    }
  }
});

// تشغيل الشاشات
updateBadges();
renderCatalog();
