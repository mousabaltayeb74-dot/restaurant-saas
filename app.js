const APP_BUILD = "FINAL_FIX_V20_2026_07_06";

const firebaseConfig = {
    apiKey: "AIzaSyCemb8B24eO8qEDgt-AcK-2WqqdLGxUeHM",
  authDomain: "restaurant-saas-c894e.firebaseapp.com",
  projectId: "restaurant-saas-c894e",
  storageBucket: "restaurant-saas-c894e.firebasestorage.app",
  messagingSenderId: "857683742785",
  appId: "1:857683742785:web:6eaa2b6f9fa598ba1736c0",
  measurementId: "G-JBLCYSKHNS"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentTenant = null;

const $ = id => document.getElementById(id);

function safeSetText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function msg(t) {
  safeSetText("authMsg", t);
}

function show(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = $(pageId);
  if (page) page.classList.add("active");

  if (pageId === "dashboard") {
    loadDashboard();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initEvents() {
  document.querySelectorAll("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => show(btn.dataset.page));
  });

  $("registerBtn")?.addEventListener("click", register);
  $("loginBtn")?.addEventListener("click", login);
  $("logoutBtn")?.addEventListener("click", logout);
  $("addItemBtn")?.addEventListener("click", addItem);
  $("addOrderBtn")?.addEventListener("click", addOrder);
}

async function register() {
  try {
    msg("جاري إنشاء الحساب...");
    const name = $("restaurantName").value.trim();
    const email = $("email").value.trim();
    const pass = $("password").value;

    if (!name || !email || !pass) {
      return msg("اكتب اسم المطعم والإيميل وكلمة المرور");
    }

    if (pass.length < 6) {
      return msg("كلمة المرور لازم تكون 6 أحرف على الأقل");
    }

    const res = await auth.createUserWithEmailAndPassword(email, pass);

    await db.collection("tenants").doc(res.user.uid).set({
      restaurantName: name,
      email: email,
      plan: "Free",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    currentUser = res.user;
    currentTenant = { restaurantName: name, email: email, plan: "Free" };

    msg("تم إنشاء الحساب بنجاح");
    show("dashboard");
  } catch (e) {
    msg("خطأ: " + arabicError(e));
  }
}

async function login() {
  try {
    msg("جاري تسجيل الدخول...");
    const email = $("email").value.trim();
    const pass = $("password").value;

    if (!email || !pass) {
      return msg("اكتب الإيميل وكلمة المرور");
    }

    await auth.signInWithEmailAndPassword(email, pass);

    msg("تم تسجيل الدخول");
    show("dashboard");
  } catch (e) {
    msg("خطأ: " + arabicError(e));
  }
}

async function logout() {
  await auth.signOut();
  show("home");
}

auth.onAuthStateChanged(async user => {
  currentUser = user;

  $("logoutBtn")?.classList.toggle("hide", !user);
  $("authBtn")?.classList.toggle("hide", !!user);

  if (user) {
    try {
      const snap = await db.collection("tenants").doc(user.uid).get();
      currentTenant = snap.exists ? snap.data() : { restaurantName: "مطعمي", email: user.email };
    } catch (e) {
      currentTenant = { restaurantName: "مطعمي", email: user.email };
    }
  } else {
    currentTenant = null;
  }
});

async function loadDashboard() {
  if (!currentUser) {
    $("notLogged")?.classList.remove("hide");
    $("dashContent")?.classList.add("hide");
    return;
  }

  $("notLogged")?.classList.add("hide");
  $("dashContent")?.classList.remove("hide");

  safeSetText("rName", currentTenant?.restaurantName || "مطعمي");
  safeSetText("rEmail", currentUser.email);

  await loadMenu();
  await loadOrders();
}

async function addItem() {
  if (!currentUser) return show("auth");

  const name = $("itemName").value.trim();
  const price = Number($("itemPrice").value);
  const category = $("itemCategory").value.trim() || "عام";

  if (!name || !price) {
    return alert("اكتب اسم الصنف والسعر");
  }

  await db.collection("tenants").doc(currentUser.uid).collection("menu").add({
    name,
    price,
    category,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  $("itemName").value = "";
  $("itemPrice").value = "";
  $("itemCategory").value = "";

  loadMenu();
}

async function loadMenu() {
  if (!currentUser) return;

  const snap = await db.collection("tenants").doc(currentUser.uid).collection("menu").orderBy("createdAt", "desc").get();

  safeSetText("menuCount", snap.size);
  const list = $("menuList");
  if (!list) return;
  list.innerHTML = "";

  snap.forEach(d => {
    const x = d.data();
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <b>${escapeHtml(x.name)}</b><br>
      ${escapeHtml(x.category || "عام")} - ${Number(x.price || 0)} جنيه
      <button class="danger">حذف</button>
    `;

    div.querySelector("button").addEventListener("click", async () => {
      await db.collection("tenants").doc(currentUser.uid).collection("menu").doc(d.id).delete();
      loadMenu();
    });

    list.appendChild(div);
  });
}

async function addOrder() {
  if (!currentUser) return show("auth");

  const customer = $("customerName").value.trim();
  const phone = $("customerPhone").value.trim();

  if (!customer) {
    return alert("اكتب اسم العميل");
  }

  await db.collection("tenants").doc(currentUser.uid).collection("orders").add({
    customer,
    phone,
    status: "new",
    total: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  $("customerName").value = "";
  $("customerPhone").value = "";

  loadOrders();
}

async function loadOrders() {
  if (!currentUser) return;

  const snap = await db.collection("tenants").doc(currentUser.uid).collection("orders").orderBy("createdAt", "desc").get();

  safeSetText("ordersCount", snap.size);
  const list = $("ordersList");
  if (!list) return;
  list.innerHTML = "";

  snap.forEach(d => {
    const x = d.data();
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <b>${escapeHtml(x.customer)}</b><br>
      ${escapeHtml(x.phone || "")}<br>
      الحالة: ${escapeHtml(x.status || "new")}
    `;
    list.appendChild(div);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function arabicError(e) {
  if (e.code === "auth/api-key-not-valid") {
    return "مفتاح Firebase في app.js ما زال خطأ أو الموقع يقرأ نسخة قديمة. افتح app.js?v=20 وتأكد من APP_BUILD.";
  }

  if (e.code === "auth/email-already-in-use") {
    return "الإيميل مستخدم من قبل، جرّب تسجيل الدخول";
  }

  if (e.code === "auth/invalid-email") {
    return "الإيميل غير صحيح";
  }

  if (e.code === "auth/weak-password") {
    return "كلمة المرور ضعيفة";
  }

  if (e.code === "auth/unauthorized-domain") {
    return "لازم تضيف دومين GitHub Pages في Firebase Authorized domains";
  }

  if (e.code === "permission-denied") {
    return "صلاحيات Firestore غير مفعلة، افتح Rules وخليها Test mode مؤقتًا";
  }

  return e.message || "حدث خطأ غير معروف";
}

initEvents();
console.log("Restaurant SaaS loaded:", APP_BUILD);
