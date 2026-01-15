// ---------- SIGN UP ----------
const signupForm = document.getElementById('signupForm');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created successfully. Please login.');
        window.location.href = 'login.html';
      } else {
        alert(data.message || 'Error creating account. Please try again.');
      }
    } catch (error) {
      alert('Server error. Please try again later.');
    }
  });
}

// ---------- LOGIN ----------
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'dashboard.html';
      } else {
        alert(data.message || 'Invalid login credentials');
      }
    } catch (error) {
      alert('Server error. Please try again later.');
    }
  });
}

// ---------- DASHBOARD ----------
async function loadDashboard() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const response = await fetch('/api/dashboard', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  document.getElementById('totalIncome').innerText = data.totalIncome;
  document.getElementById('totalExpense').innerText = data.totalExpense;
  document.getElementById('balance').innerText = data.balance;

  loadTransactions();
}

async function loadTransactions() {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/transactions', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const transactions = await response.json();
  const table = document.getElementById('transactionTable');
  table.innerHTML = '';

  transactions.forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${t.type}</td>
      <td>${t.amount}</td>
      <td>${t.category}</td>
      <td>${t.description || ''}</td>
      <td>${new Date(t.date).toLocaleDateString()}</td>
      <td><button onclick="deleteTransaction('${t._id}')">Delete</button></td>
    `;
    table.appendChild(row);
  });
}

async function addTransaction() {
  const token = localStorage.getItem('token');

  const type = document.getElementById('type').value;
  const amount = document.getElementById('amount').value;
  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value;

  await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ type, amount, category, description })
  });

  loadDashboard();
}

async function deleteTransaction(id) {
  const token = localStorage.getItem('token');

  await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  loadDashboard();
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

if (window.location.pathname.includes('dashboard.html')) {
  loadDashboard();
}
