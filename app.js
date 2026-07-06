/*
  Restaurant SaaS Demo
  --------------------
  This version works immediately with localStorage for demo.
  To make it fully cloud-based, connect Firebase using the instructions in README.md.
*/

let state = {
  tenant: JSON.parse(localStorage.getItem('tenant')) || {
    ownerName: 'Demo Owner',
    tenantName: 'Golden Bite',
    email: 'demo@restaurant.com',
    plan: 'Free'
  },
  menu: JSON.parse(localStorage.getItem('menu')) || [
    { name: 'برجر لحم', price: 2500, image: 'Burger' },
    { name: 'بيتزا دجاج', price: 3500, image: 'Pizza' },
    { name: 'عصير مانجو', price: 900, image: 'Juice' }
  ],
  orders: JSON.parse(localStorage.getItem('orders')) || [
    { customer: 'أحمد', items: 'برجر لحم + عصير', status: 'جديد' },
    { customer: 'سارة', items: 'بيتزا دجاج', status: 'قيد التحضير' }
  ]
};

function save() {
  localStorage.setItem('tenant', JSON.stringify(state.tenant));
  localStorage.setItem('menu', JSON.stringify(state.menu));
  localStorage.setItem('orders', JSON.stringify(state.orders));
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'demo') renderDashboard();
}

document.querySelectorAll('[data-page]').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.querySelectorAll('[data-panel]').forEach(btn => {
  btn.addEventListener('click', () => showPanel(btn.dataset.panel));
});

const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', e => {
  e.preventDefault();
  state.tenant = {
    ownerName: document.getElementById('ownerName').value,
    tenantName: document.getElementById('tenantName').value,
    email: document.getElementById('registerEmail').value,
    plan: document.getElementById('plan').value
  };
  state.menu = [];
  state.orders = [];
  save();
  showPage('demo');
});

const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  showPage('demo');
});

document.getElementById('demoBtn').addEventListener('click', () => showPage('demo'));

const menuForm = document.getElementById('menuForm');
menuForm.addEventListener('submit', e => {
  e.preventDefault();
  state.menu.push({
    name: document.getElementById('itemName').value,
    price: Number(document.getElementById('itemPrice').value),
    image: document.getElementById('itemImage').value || 'Food'
  });
  menuForm.reset();
  save();
  renderDashboard();
});

const orderForm = document.getElementById('orderForm');
orderForm.addEventListener('submit', e => {
  e.preventDefault();
  state.orders.push({
    customer: document.getElementById('customerName').value,
    items: document.getElementById('orderItems').value,
    status: 'جديد'
  });
  orderForm.reset();
  save();
  renderDashboard();
});

window.deleteMenuItem = index => {
  state.menu.splice(index, 1);
  save();
  renderDashboard();
};

window.deleteOrder = index => {
  state.orders.splice(index, 1);
  save();
  renderDashboard();
};

window.upgradePlan = plan => {
  state.tenant.plan = plan;
  save();
  renderDashboard();
};

function renderDashboard() {
  document.getElementById('dashTenant').textContent = state.tenant.tenantName;
  document.getElementById('dashOwner').textContent = 'صاحب الحساب: ' + state.tenant.ownerName;
  document.getElementById('menuCount').textContent = state.menu.length;
  document.getElementById('ordersCount').textContent = state.orders.length;
  document.getElementById('currentPlan').textContent = state.tenant.plan;
  document.getElementById('subPlan').textContent = state.tenant.plan;

  document.getElementById('menuList').innerHTML = state.menu.map((item, i) => `
    <div class="row">
      <div><strong>${item.name}</strong><br><small>${item.image}</small></div>
      <div>${item.price} جنيه</div>
      <button class="outline" onclick="deleteMenuItem(${i})">حذف</button>
    </div>
  `).join('') || '<p>لا توجد أصناف بعد.</p>';

  document.getElementById('ordersList').innerHTML = state.orders.map((order, i) => `
    <div class="row">
      <div><strong>${order.customer}</strong><br><small>${order.items}</small></div>
      <div>${order.status}</div>
      <button class="outline" onclick="deleteOrder(${i})">حذف</button>
    </div>
  `).join('') || '<p>لا توجد طلبات بعد.</p>';
}

renderDashboard();
