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

function msg(t) {
  $("authMsg").textContent = t;
}

function show(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  $(pageId).classList.add("active");

  if (pageId === "dashboard") {
    loadDashboard();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initEvents() {
  document.querySelectorAll("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => show(btn.dataset.page));
  });

  $("registerBtn").addEventListener("click", register);
  $("loginBtn").addEventListener("click", login);
  $("logoutBtn").addEventListener("click", logout);
  $("addItemBtn").addEventListener("click", addItem);
  $("addOrderBtn").addEventListener("click", addOrder);
}

async function register() {
  try {
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

    msg("تم إنشاء الحساب بنجاح");
    show("dashboard");
  } catch (e) {
    msg("خطأ: " + arabicError(e));
  }
}

async function login() {
  try {
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

  $("logoutBtn").classList.toggle("hide", !user);
  $("authBtn").classList.toggle("hide", !!user);

  if (user) {
    const snap = await db.collection("tenants").doc(user.uid).get();

    currentTenant = snap.exists
      ? snap.data()
      : { restaurantName: "مطعمي", email: user.email };

    loadDashboard();
  } else {
    currentTenant = null;
  }
});

async function loadDashboard() {
  if (!currentUser) {
    $("notLogged").classList.remove("hide");
    $("dashContent").classList.add("hide");
    return;
  }

  $("notLogged").classList.add("hide");
  $("dashContent").classList.remove("hide");

  $("rName").textContent = currentTenant?.restaurantName || "مطعمي";
  $("rEmail").textContent = currentUser.email;

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

  await db
    .collection("tenants")
    .doc(currentUser.uid)
    .collection("menu")
    .add({
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

  const snap = await db
    .collection("tenants")
    .doc(currentUser.uid)
    .collection("menu")
    .orderBy("createdAt", "desc")
    .get();

  $("menuCount").textContent = snap.size;
  $("menuList").innerHTML = "";

  snap.forEach(d => {
    const x = d.data();
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <b>${x.name}</b><br>
      ${x.category} - ${x.price} جنيه
      <button class="danger">حذف</button>
    `;

    div.querySelector("button").addEventListener("click", async () => {
      await db
        .collection("tenants")
        .doc(currentUser.uid)
        .collection("menu")
        .doc(d.id)
        .delete();

      loadMenu();
    });

    $("menuList").appendChild(div);
  });
}

async function addOrder() {
  if (!currentUser) return show("auth");

  const customer = $("customerName").value.trim();
  const phone = $("customerPhone").value.trim();

  if (!customer) {
    return alert("اكتب اسم العميل");
  }

  await db
    .collection("tenants")
    .doc(currentUser.uid)
    .collection("orders")
    .add({
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

  const snap = await db
    .collection("tenants")
    .doc(currentUser.uid)
    .collection("orders")
    .orderBy("createdAt", "desc")
    .get();

  $("ordersCount").textContent = snap.size;
  $("ordersList").innerHTML = "";

  snap.forEach(d => {
    const x = d.data();

    $("ordersList").innerHTML += `
      <div class="item">
        <b>${x.customer}</b><br>
        ${x.phone || ""}<br>
        الحالة: ${x.status}
      </div>
    `;
  });
}

function arabicError(e) {
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

  return e.message;
}

initEvents()
