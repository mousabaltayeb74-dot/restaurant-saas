import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCemBB24eO8qEDqt-AcK-2WqqdLGxUeHM',
  authDomain: 'restaurant-saas-c894e.firebaseapp.com',
  projectId: 'restaurant-saas-c894e',
  storageBucket: 'restaurant-saas-c894e.firebasestorage.app',
  messagingSenderId: '857683742785',
  appId: '1:857683742785:web:6eaa2b6f9fa598ba1736c0',
  measurementId: 'G-JBLCYSKHNS'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentTenantId = null;
let unsubMenu = null;
let unsubOrders = null;
let tenant = null;
let menu = [];
let orders = [];

const $ = (id) => document.getElementById(id);

function showMessage(text, ok = true) {
  let box = $('messageBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'messageBox';
    box.className = 'message-box';
    document.body.appendChild(box);
  }
  box.textContent = text;
  box.style.background = ok ? '#1f7a4d' : '#9b1c1c';
  box.classList.add('show');
  setTimeout(() => box.classList.remove('show'), 3500);
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $(id).classList.add('active');
  if (id === 'demo') renderDashboard();
}

function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  $(id).classList.add('active');
}

document.querySelectorAll('[data-page]').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

document.querySelectorAll('[data-panel]').forEach(btn => {
  btn.addEventListener('click', () => showPanel(btn.dataset.panel));
});

function tenantRef(uid) {
  return doc(db, 'tenants', uid);
}

function menuCollection(uid) {
  return collection(db, 'tenants', uid, 'menu');
}

function ordersCollection(uid) {
  return collection(db, 'tenants', uid, 'orders');
}

async function loadTenant(uid) {
  const snap = await getDoc(tenantRef(uid));
  if (snap.exists()) {
    tenant = snap.data();
  } else {
    tenant = {
      ownerName: auth.currentUser?.email || 'Restaurant Owner',
      tenantName: 'My Restaurant',
      email: auth.currentUser?.email || '',
      plan: 'Free'
    };
    await setDoc(tenantRef(uid), { ...tenant, createdAt: serverTimestamp() });
  }
  currentTenantId = uid;
  listenToTenantData(uid);
  showPage('demo');
  renderDashboard();
}

function listenToTenantData(uid) {
  if (unsubMenu) unsubMenu();
  if (unsubOrders) unsubOrders();

  unsubMenu = onSnapshot(query(menuCollection(uid), orderBy('createdAt', 'desc')), (snapshot) => {
    menu = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDashboard();
  });

  unsubOrders = onSnapshot(query(ordersCollection(uid), orderBy('createdAt', 'desc')), (snapshot) => {
    orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDashboard();
  });
}

$('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const ownerName = $('ownerName').value.trim();
  const tenantName = $('tenantName').value.trim();
  const email = $('registerEmail').value.trim();
  const password = $('registerPassword').value;
  const plan = $('plan').value;

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(tenantRef(credential.user.uid), {
      ownerName,
      tenantName,
      email,
      plan,
      createdAt: serverTimestamp()
    });

    await addDoc(menuCollection(credential.user.uid), {
      name: 'برجر لحم',
      price: 2500,
      image: 'Burger',
      createdAt: serverTimestamp()
    });

    await addDoc(ordersCollection(credential.user.uid), {
      customer: 'عميل تجريبي',
      items: 'برجر لحم + عصير',
      status: 'جديد',
      createdAt: serverTimestamp()
    });

    showMessage('تم إنشاء حساب المطعم وحفظ البيانات في Firebase');
  } catch (error) {
    showMessage(error.message, false);
  }
});

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage('تم تسجيل الدخول بنجاح');
  } catch (error) {
    showMessage(error.message, false);
  }
});

$('demoBtn').addEventListener('click', async () => {
  $('loginEmail').value = 'demo@restaurant-saas.com';
  $('loginPassword').value = '123456';
  showMessage('يمكنك إنشاء حساب جديد بدل الدخول التجريبي');
});

$('menuForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentTenantId) return showMessage('سجّل الدخول أولًا', false);
  try {
    await addDoc(menuCollection(currentTenantId), {
      name: $('itemName').value.trim(),
      price: Number($('itemPrice').value),
      image: $('itemImage').value.trim() || 'Food',
      createdAt: serverTimestamp()
    });
    $('menuForm').reset();
    showMessage('تم حفظ الصنف في Firestore');
  } catch (error) {
    showMessage(error.message, false);
  }
});

$('orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentTenantId) return showMessage('سجّل الدخول أولًا', false);
  try {
    await addDoc(ordersCollection(currentTenantId), {
      customer: $('customerName').value.trim(),
      items: $('orderItems').value.trim(),
      status: 'جديد',
      createdAt: serverTimestamp()
    });
    $('orderForm').reset();
    showMessage('تم حفظ الطلب في Firestore');
  } catch (error) {
    showMessage(error.message, false);
  }
});

window.deleteMenuItem = async (id) => {
  if (!currentTenantId) return;
  await deleteDoc(doc(db, 'tenants', currentTenantId, 'menu', id));
  showMessage('تم حذف الصنف');
};

window.deleteOrder = async (id) => {
  if (!currentTenantId) return;
  await deleteDoc(doc(db, 'tenants', currentTenantId, 'orders', id));
  showMessage('تم حذف الطلب');
};

window.upgradePlan = async (plan) => {
  if (!currentTenantId) return showMessage('سجّل الدخول أولًا', false);
  await updateDoc(tenantRef(currentTenantId), { plan });
  tenant.plan = plan;
  renderDashboard();
  showMessage('تم تحديث الخطة إلى ' + plan);
};

window.logout = async () => {
  await signOut(auth);
  showPage('home');
  showMessage('تم تسجيل الخروج');
};

function renderDashboard() {
  const activeTenant = tenant || {
    tenantName: 'Restaurant SaaS',
    ownerName: 'لم يتم تسجيل الدخول',
    plan: 'Free'
  };

  $('dashTenant').textContent = activeTenant.tenantName;
  $('dashOwner').textContent = 'صاحب الحساب: ' + activeTenant.ownerName;
  $('menuCount').textContent = menu.length;
  $('ordersCount').textContent = orders.length;
  $('currentPlan').textContent = activeTenant.plan;
  $('subPlan').textContent = activeTenant.plan;

  $('menuList').innerHTML = menu.map((item) => `
    <div class="row">
      <div><strong>${item.name}</strong><br><small>${item.image || 'Food'}</small></div>
      <div>${item.price || 0} جنيه</div>
      <button class="outline" onclick="deleteMenuItem('${item.id}')">حذف</button>
    </div>
  `).join('') || '<p>لا توجد أصناف بعد.</p>';

  $('ordersList').innerHTML = orders.map((order) => `
    <div class="row">
      <div><strong>${order.customer}</strong><br><small>${order.items}</small></div>
      <div>${order.status || 'جديد'}</div>
      <button class="outline" onclick="deleteOrder('${order.id}')">حذف</button>
    </div>
  `).join('') || '<p>لا توجد طلبات بعد.</p>';
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadTenant(user.uid);
  } else {
    currentTenantId = null;
    tenant = null;
    menu = [];
    orders = [];
    if (unsubMenu) unsubMenu();
    if (unsubOrders) unsubOrders();
    renderDashboard();
  }
});

renderDashboard();
