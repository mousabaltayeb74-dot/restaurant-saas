const firebaseConfig = {
  apiKey: "AIzaSyCembBB24eO8qEDqt-AcK-2WqqdLGxUeHM",
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
let unsubMenu = null;
let unsubOrders = null;

const $ = (id) => document.getElementById(id);
const views = document.querySelectorAll('.view');
const navButtons = document.querySelectorAll('[data-view]');

function showToast(msg){
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(()=>t.classList.add('hidden'), 3200);
}

function showView(id){
  views.forEach(v => v.classList.toggle('show', v.id === id));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === id));
}

navButtons.forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));

function tenantRef(uid){ return db.collection('restaurants').doc(uid); }
function menuRef(uid){ return tenantRef(uid).collection('menu'); }
function ordersRef(uid){ return tenantRef(uid).collection('orders'); }

$('registerForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const restaurantName = $('regRestaurant').value.trim();
  const ownerName = $('regOwner').value.trim();
  const email = $('regEmail').value.trim();
  const password = $('regPassword').value;
  const plan = $('regPlan').value;
  try{
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: restaurantName });
    await tenantRef(cred.user.uid).set({
      tenantId: cred.user.uid,
      restaurantName,
      ownerName,
      email,
      plan,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      type: 'restaurant-tenant'
    });
    e.target.reset();
    showToast('تم إنشاء حساب المطعم وحفظه في Firebase');
  }catch(err){
    showToast('خطأ: ' + friendlyError(err));
  }
});

$('loginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  try{
    await auth.signInWithEmailAndPassword($('loginEmail').value.trim(), $('loginPassword').value);
    e.target.reset();
    showToast('تم تسجيل الدخول');
  }catch(err){ showToast('خطأ: ' + friendlyError(err)); }
});

$('logoutBtn').addEventListener('click', async()=>{
  await auth.signOut();
  showToast('تم تسجيل الخروج');
});

$('menuForm').addEventListener('submit', async(e)=>{
  e.preventDefault();
  if(!currentUser) return showToast('سجل الدخول أولاً');
  const item = {
    name: $('itemName').value.trim(),
    price: Number($('itemPrice').value),
    category: $('itemCategory').value.trim(),
    image: $('itemImage').value.trim(),
    description: $('itemDesc').value.trim(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await menuRef(currentUser.uid).add(item);
  e.target.reset();
  showToast('تم حفظ الصنف في Firestore');
});

$('orderForm').addEventListener('submit', async(e)=>{
  e.preventDefault();
  if(!currentUser) return showToast('سجل الدخول أولاً');
  const order = {
    customerName: $('customerName').value.trim(),
    customerPhone: $('customerPhone').value.trim(),
    items: $('orderItems').value.trim(),
    status: 'new',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await ordersRef(currentUser.uid).add(order);
  e.target.reset();
  showToast('تم حفظ الطلب في Firestore');
});

$('copyPublicLink').addEventListener('click', async()=>{
  if(!currentUser) return;
  const link = `${location.origin}${location.pathname}?tenant=${currentUser.uid}`;
  try{ await navigator.clipboard.writeText(link); showToast('تم نسخ رابط العملاء'); }
  catch{ showToast(link); }
});

auth.onAuthStateChanged(async(user)=>{
  currentUser = user;
  $('logoutBtn').classList.toggle('hidden', !user);
  document.querySelector('.auth-link').textContent = user ? 'لوحة التحكم' : 'دخول / حساب';
  document.querySelector('.auth-link').dataset.view = user ? 'dashboard' : 'auth';
  if(unsubMenu) unsubMenu();
  if(unsubOrders) unsubOrders();
  if(user){
    await loadTenant(user.uid);
    listenMenu(user.uid);
    listenOrders(user.uid);
    showView('dashboard');
  }else{
    $('menuList').innerHTML = '';
    $('ordersList').innerHTML = '';
    showView('home');
  }
});

async function loadTenant(uid){
  const snap = await tenantRef(uid).get();
  if(!snap.exists){
    await tenantRef(uid).set({ tenantId: uid, restaurantName: auth.currentUser.email, plan:'Free', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  }
  const data = (await tenantRef(uid).get()).data();
  $('tenantTitle').textContent = data.restaurantName || 'لوحة التحكم';
  $('tenantMeta').textContent = `Tenant ID: ${uid} | Owner: ${data.ownerName || 'غير محدد'}`;
  $('tenantPlan').textContent = data.plan || 'Free';
}

function listenMenu(uid){
  unsubMenu = menuRef(uid).orderBy('createdAt','desc').onSnapshot(snap=>{
    $('menuCount').textContent = snap.size;
    if(snap.empty){ $('menuList').innerHTML = '<p>لا توجد أصناف بعد.</p>'; return; }
    $('menuList').innerHTML = '';
    snap.forEach(doc=>{
      const d = doc.data();
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `<div class="row"><h4>${escapeHtml(d.name)}</h4><button class="mini-btn" data-delete-menu="${doc.id}">حذف</button></div><p>${escapeHtml(d.category || '')} • ${d.price || 0} SDG</p><p>${escapeHtml(d.description || '')}</p>`;
      $('menuList').appendChild(div);
    });
    document.querySelectorAll('[data-delete-menu]').forEach(b=>b.onclick=()=>menuRef(uid).doc(b.dataset.deleteMenu).delete());
  }, err=> showToast('مشكلة في قراءة المنيو: '+err.message));
}

function listenOrders(uid){
  unsubOrders = ordersRef(uid).orderBy('createdAt','desc').onSnapshot(snap=>{
    $('ordersCount').textContent = snap.size;
    if(snap.empty){ $('ordersList').innerHTML = '<p>لا توجد طلبات بعد.</p>'; return; }
    $('ordersList').innerHTML = '';
    snap.forEach(doc=>{
      const d = doc.data();
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `<div class="row"><h4>${escapeHtml(d.customerName)}</h4><button class="mini-btn" data-delete-order="${doc.id}">حذف</button></div><p>${escapeHtml(d.customerPhone || '')}</p><p>${escapeHtml(d.items || '')}</p><p>الحالة: ${escapeHtml(d.status || 'new')}</p>`;
      $('ordersList').appendChild(div);
    });
    document.querySelectorAll('[data-delete-order]').forEach(b=>b.onclick=()=>ordersRef(uid).doc(b.dataset.deleteOrder).delete());
  }, err=> showToast('مشكلة في قراءة الطلبات: '+err.message));
}

function friendlyError(err){
  const code = err.code || '';
  if(code.includes('email-already-in-use')) return 'البريد مستخدم مسبقًا';
  if(code.includes('weak-password')) return 'كلمة المرور يجب أن تكون 6 أحرف أو أكثر';
  if(code.includes('invalid-email')) return 'البريد الإلكتروني غير صحيح';
  if(code.includes('wrong-password') || code.includes('invalid-credential')) return 'بيانات الدخول غير صحيحة';
  if(code.includes('permission-denied')) return 'راجع قواعد Firestore أو اختر Test mode';
  return err.message || 'حدث خطأ غير معروف';
}
function escapeHtml(str){ return String(str || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
