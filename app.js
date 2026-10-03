const DATA_KEY = 'evergreen_review_data';
const SESSION_KEY = 'evergreen_review_user';
const app = document.querySelector('#app');
const message = document.querySelector('#message');

function newData() {
  return {
    users: [{
      id: 'admin', name: 'Administrator', email: 'admin123@gmail.com',
      password: 'admin123', role: 'admin'
    }],
    loans: []
  };
}

let data;
try {
  data = JSON.parse(localStorage.getItem(DATA_KEY)) || newData();
} catch {
  data = newData();
}

if (!data.users.some(user => user.role === 'admin')) {
  data.users.push(newData().users[0]);
}
localStorage.setItem(DATA_KEY, JSON.stringify(data));

function save() {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

function say(text) {
  message.textContent = text;
  message.classList.add('show');
  setTimeout(() => message.classList.remove('show'), 2500);
}

function currentUser() {
  return data.users.find(user => user.id === sessionStorage.getItem(SESSION_KEY));
}

function go(page) {
  location.hash = page;
}

function loginPage(signup = false) {
  app.innerHTML = `
    <div class="auth">
      <section class="welcome">
        <div class="logo brand"><span class="leaf-mark" aria-hidden="true"></span><span>Evergreen</span></div>
        <div><h1>Banking, made clear.</h1><p>A simple way to manage a demo bank account.</p></div>
        <small>ONLINE BANKING · SDC PROJECT</small>
      </section>
      <section class="form-side">
        <form class="form" id="accountForm">
          <h2>${signup ? 'Create an account' : 'Welcome back'}</h2>
          <p class="sub">${signup ? 'Register as a new customer.' : 'Sign in to continue.'}</p>
          ${signup ? `<div class="field"><label>Name</label><input name="name" required></div>` : ''}
          <div class="field"><label>Email</label><input name="email" type="email" required></div>
          <div class="field"><label>Password</label><input name="password" type="password" minlength="6" required></div>
          ${signup ? `<div class="field"><label>4-digit balance PIN</label><input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required></div>` : ''}
          <button class="button primary wide">${signup ? 'Sign up' : 'Log in'}</button>
          <p class="links">${signup ? 'Already registered?' : 'New customer?'}
            <button class="link" type="button" id="switch">${signup ? 'Log in' : 'Sign up'}</button>
          </p>
        </form>
      </section>
    </div>`;

  document.querySelector('#switch').onclick = () => go(signup ? 'login' : 'signup');
  document.querySelector('#accountForm').onsubmit = event => {
    event.preventDefault();
    const form = new FormData(event.target);
    const email = form.get('email').trim().toLowerCase();

    if (signup) {
      if (data.users.some(user => user.email === email)) return say('That email is already registered.');
      const newUser = {
        id: Date.now().toString(), name: form.get('name').trim(), email,
        password: form.get('password'), pin: form.get('pin'), role: 'user',
        account: 'EVG' + Date.now().toString().slice(-7), balance: 0, status: 'Active'
      };
      data.users.push(newUser);
      save();
      sessionStorage.setItem(SESSION_KEY, newUser.id);
      go('home');
      return;
    }

    const found = data.users.find(user => user.email === email && user.password === form.get('password'));
    if (!found || found.status === 'Suspended') return say('Email or password is incorrect.');
    sessionStorage.setItem(SESSION_KEY, found.id);
    go(found.role === 'admin' ? 'admin' : 'home');
  };
}

function frame(title, active, content) {
  const user = currentUser();
  const admin = user.role === 'admin';
  const links = admin
    ? [['admin', 'Overview'], ['customers', 'Customers']]
    : [['home', 'My account'], ['request', 'Request a loan']];

  app.innerHTML = `
    <div class="layout">
      <nav class="nav" id="nav">
        <div class="logo brand"><span class="leaf-mark" aria-hidden="true"></span><span>Evergreen</span></div>
        <small>${admin ? 'ADMIN MODULE' : 'USER MODULE'}</small>
        ${links.map(([page, label]) => `<button class="${active === page ? 'active' : ''}" data-page="${page}">${label}</button>`).join('')}
        ${!admin ? `<div class="nav-planned">
          <button type="button" disabled>transfer money</button>
          <button type="button" disabled>Scan QR</button>
          <button type="button" disabled>Pay bill</button>
          <button type="button" disabled>Customer Support</button>
        </div>` : ''}
        <button class="logout" id="logout">Log out</button>
      </nav>
      <header class="top"><span>${title}</span><span>${user.name}</span></header>
      <section class="main">${content}</section>
    </div>`;

  document.querySelectorAll('[data-page]').forEach(button => {
    button.onclick = () => go(button.dataset.page);
  });
  document.querySelector('#logout').onclick = () => {
    sessionStorage.removeItem(SESSION_KEY);
    go('login');
  };
}

function homePage(user) {
  const myLoans = data.loans.filter(loan => loan.userId === user.id);
  frame('My account', 'home', `
    <div class="head"><h1>Hello, ${user.name}</h1><p>Your Evergreen account overview.</p></div>
    <div class="grid">
      <div class="section"><small>ACCOUNT NUMBER</small><div class="amount">${user.account}</div></div>
      <div class="section"><small>AVAILABLE BALANCE</small><div class="amount">••••••</div>
        <details><summary>Check with PIN</summary><div class="field"><input id="pin" type="password" maxlength="4" placeholder="4-digit PIN"></div><button class="button quiet" id="check">Show balance</button><p id="balance"></p></details>
      </div>
      <div class="section"><small>ACCOUNT STATUS</small><div class="amount">${user.status}</div></div>
    </div>
    <div class="section"><h2>My loan requests</h2>${myLoans.length ? myLoans.map(loan => `<p>${loan.purpose} · ₹${loan.amount} · <b>${loan.status}</b></p>`).join('') : '<p class="help">No requests yet.</p>'}</div>
    <div class="section">
  <h2>Change PIN</h2>
  <form id="pinForm">
    <div class="field">
      <label>Current PIN</label>
      <input name="oldPin" type="password" inputmode="numeric"
             maxlength="4" pattern="[0-9]{4}" required>
    </div>
    <div class="field">
      <label>New 4-digit PIN</label>
      <input name="newPin" type="password" inputmode="numeric"
             maxlength="4" pattern="[0-9]{4}" required>
    </div>
    <button class="button primary">Update PIN</button>
  </form>
</div>
    `);
    document.querySelector('#pinForm').onsubmit = event => {
  event.preventDefault();

  const form = new FormData(event.target);

  if (form.get('oldPin') !== user.pin) {
    return say('Current PIN is incorrect.');
  }

  user.pin = form.get('newPin');
  save();
  event.target.reset();
  say('PIN changed successfully.');
};

  document.querySelector('#check').onclick = () => {
    if (document.querySelector('#pin').value !== user.pin) return say('PIN is incorrect.');
    document.querySelector('#balance').textContent = 'Balance: ₹' + user.balance;
  };
}

function loanPage(user) {
  frame('Request a loan', 'request', `
    <div class="head"><h1>Request a loan</h1><p>Submit your request for administrator review.</p></div>
    <div class="section" style="max-width:540px">
      <form id="loanForm">
        <div class="field"><label>Purpose</label><input name="purpose" required></div>
        <div class="field"><label>Amount (₹)</label><input name="amount" type="number" min="10000" required></div>
        <button class="button primary">Submit request</button>
      </form>
    </div>`);
  document.querySelector('#loanForm').onsubmit = event => {
    event.preventDefault();
    const form = new FormData(event.target);
    data.loans.push({
      id: Date.now().toString(), userId: user.id,
      purpose: form.get('purpose'), amount: Number(form.get('amount')), status: 'Pending'
    });
    save(); say('Loan request submitted successfully.'); go('home');
  };
}

function adminPage() {
  const customers = data.users.filter(user => user.role === 'user');
  const pendingLoans = data.loans.filter(loan => loan.status === 'Pending');
  frame('Admin overview', 'admin', `
    <div class="head"><h1>Admin overview</h1><p>Manage customer accounts and loan requests.</p></div>
    <div class="grid">
      <div class="section"><small>CUSTOMERS</small><div class="amount">${customers.length}</div></div>
      <div class="section"><small>PENDING LOANS</small><div class="amount">${pendingLoans.length}</div></div>
      <div class="section"><small>MODULE</small><div class="amount">Admin</div></div>
    </div>
    <div class="section"><h2>Recent loan requests</h2>
      ${pendingLoans.length ? pendingLoans.map(loan => {
        const customer = customers.find(user => user.id === loan.userId);
        return `<p>${customer?.name || 'Customer'} · ${loan.purpose} · ₹${loan.amount}
          <button class="button quiet approve" data-id="${loan.id}">Approve</button>
          <button class="button decline" data-id="${loan.id}">Decline</button></p>`;
      }).join('') : '<p class="help">No pending loans.</p>'}
    </div>`);

  document.querySelectorAll('.approve').forEach(button => {
    button.onclick = () => {
      const loan = data.loans.find(item => item.id === button.dataset.id);
      const customer = data.users.find(item => item.id === loan.userId);
      loan.status = 'Approved';
      customer.balance += loan.amount;
      save(); say('Loan approved and credited.'); go('admin');
    };
  });
  document.querySelectorAll('.decline').forEach(button => {
    button.onclick = () => {
      data.loans.find(item => item.id === button.dataset.id).status = 'Declined';
      save(); go('admin');
    };
  });
}

function customerPage() {
  const customers = data.users.filter(user => user.role === 'user');
  frame('Customers', 'customers', `
    <div class="head"><h1>Customers</h1><p>Registered Evergreen user accounts.</p></div>
    <div class="section"><table><thead><tr><th>Name</th><th>Email</th><th>Account</th><th>Status</th></tr></thead><tbody>
      ${customers.map(user => `<tr><td>${user.name}</td><td>${user.email}</td><td>${user.account}</td><td>${user.status}</td></tr>`).join('')}
    </tbody></table></div>`);
}

function route() {
  try { data = JSON.parse(localStorage.getItem(DATA_KEY)) || data; } catch {}
  const user = currentUser();
  const page = location.hash.slice(1) || 'login';
  if (!user) return loginPage(page === 'signup');
  if (user.role === 'admin') {
    if (page === 'customers') customerPage();
    else if (page === 'loans') adminPage();
    else adminPage();
  } else if (page === 'request') loanPage(user);
  else homePage(user);
}

window.addEventListener('hashchange', route);
route();
