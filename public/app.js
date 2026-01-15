const userId = localStorage.getItem("userId");

/* ================= LOGIN ================= */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("userId", data.userId);
      window.location.href = "/dashboard";
    } else {
      alert(data.message);
    }
  });
}

/* ================= SIGNUP ================= */
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async e => {
    e.preventDefault();

    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const res = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (data.success) {
      alert("Account created. Please login.");
      window.location.href = "/";
    } else {
      alert(data.message);
    }
  });
}

/* ================= DASHBOARD ================= */
if (window.location.pathname === "/dashboard") {
  if (!userId) {
    alert("Please login again");
    window.location.href = "/";
  }

  loadTransactions();

  document.getElementById("addForm").addEventListener("submit", async e => {
    e.preventDefault();

    const type = document.getElementById("type").value;
    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;

    await fetch("/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        type,
        amount,
        category,
        description
      })
    });

    e.target.reset();
    loadTransactions();
  });
}

async function loadTransactions() {
  const res = await fetch(`/transactions/${userId}`);
  const data = await res.json();

  let income = 0,
    expense = 0;

  const list = document.getElementById("transactions");
  list.innerHTML = "";

  data.forEach(t => {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;

    const li = document.createElement("li");
    li.textContent = `${t.type} - ₹${t.amount} (${t.category})`;
    list.appendChild(li);
  });

  document.getElementById("income").textContent = income;
  document.getElementById("expense").textContent = expense;
  document.getElementById("balance").textContent = income - expense;
}

/* ================= LOGOUT ================= */
function logout() {
  localStorage.removeItem("userId");
  window.location.href = "/";
}
