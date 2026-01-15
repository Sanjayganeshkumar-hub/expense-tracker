const userId = localStorage.getItem("userId");

if (!userId) {
  alert("Please login first");
  window.location.href = "/";
}

const list = document.getElementById("list");
const summary = document.getElementById("summary");

async function load() {
  const res = await fetch(`/transactions/${userId}`);
  const txns = await res.json();

  let income = 0, expense = 0;
  list.innerHTML = "";

  txns.forEach(t => {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;

    const li = document.createElement("li");
    li.textContent = `${t.type} - ₹${t.amount} (${t.category})`;
    list.appendChild(li);
  });

  summary.textContent = `Income: ₹${income} | Expense: ₹${expense} | Balance: ₹${income - expense}`;
}

load();

document.getElementById("txnForm").onsubmit = async (e) => {
  e.preventDefault();

  await fetch("/transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      type: type.value,
      amount: Number(amount.value),
      category: category.value,
      description: description.value
    })
  });

  e.target.reset();
  load();
};

document.getElementById("logout").onclick = () => {
  localStorage.removeItem("userId");
  window.location.href = "/";
};
