document.addEventListener("DOMContentLoaded", () => {

  const token = localStorage.getItem("token");

  /* ===== PROTECT DASHBOARD ===== */
  if (window.location.pathname.includes("dashboard") && !token) {
    window.location.href = "/login.html";
    return;
  }

  /* ===== LOGOUT ===== */
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    };
  }

  /* ===== ADD TRANSACTION ===== */
  const form = document.getElementById("transactionForm");
  if (form) {
    loadTransactions();

    form.addEventListener("submit", async e => {
      e.preventDefault();

      const data = {
        type: type.value,
        amount: amount.value,
        category: category.value,
        description: description.value
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        form.reset();
        loadTransactions();
      } else {
        alert("Transaction failed");
      }
    });
  }

  /* ===== LOAD TRANSACTIONS ===== */
  async function loadTransactions() {
    const res = await fetch("/api/transactions", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const txs = await res.json();

    let income = 0, expense = 0;
    transactionList.innerHTML = "";

    txs.forEach(t => {
      const li = document.createElement("li");
      li.textContent = `${t.type} | ${t.category} | ₹${t.amount}`;
      transactionList.appendChild(li);

      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });

    incomeEl.textContent = `₹${income}`;
    expenseEl.textContent = `₹${expense}`;
    balanceEl.textContent = `₹${income - expense}`;
  }

});
