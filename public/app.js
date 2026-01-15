document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     LOGOUT
  ========================== */
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    });
  }

  /* =========================
     ADD TRANSACTION
  ========================== */
  const transactionForm = document.getElementById("transactionForm");

  if (transactionForm) {
    loadTransactions();

    transactionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const type = document.getElementById("type").value;
      const amount = document.getElementById("amount").value;
      const category = document.getElementById("category").value;
      const description = document.getElementById("description").value;

      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ type, amount, category, description })
        });

        if (res.ok) {
          transactionForm.reset();
          loadTransactions();
        } else {
          alert("Failed to add transaction");
        }

      } catch (err) {
        console.error(err);
        alert("Server error");
      }
    });
  }

  /* =========================
     LOAD TRANSACTIONS
  ========================== */
  async function loadTransactions() {
    try {
      const res = await fetch("/api/transactions", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await res.json();

      const list = document.getElementById("transactionList");
      const incomeEl = document.getElementById("income");
      const expenseEl = document.getElementById("expense");
      const balanceEl = document.getElementById("balance");

      list.innerHTML = "";
      let income = 0, expense = 0;

      data.forEach(tx => {
        const li = document.createElement("li");
        li.textContent = `${tx.category} - ₹${tx.amount}`;
        list.appendChild(li);

        if (tx.type === "income") income += tx.amount;
        else expense += tx.amount;
      });

      incomeEl.textContent = `₹${income}`;
      expenseEl.textContent = `₹${expense}`;
      balanceEl.textContent = `₹${income - expense}`;

    } catch (err) {
      console.error(err);
    }
  }

});
