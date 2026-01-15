// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

const user = JSON.parse(localStorage.getItem('user'));
document.getElementById('userName').textContent = `Hello, ${user.name}`;

// Set today's date as default
document.getElementById('date').valueAsDate = new Date();

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// API calls
async function fetchDashboard() {
    try {
        const response = await fetch('http://localhost:3000/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        document.getElementById('totalIncome').textContent = `₹${data.totalIncome.toFixed(2)}`;
        document.getElementById('totalExpense').textContent = `₹${data.totalExpense.toFixed(2)}`;
        document.getElementById('balance').textContent = `₹${data.balance.toFixed(2)}`;
        
        drawCategoryChart(data.categoryTotals);
    } catch (error) {
        console.error('Error fetching dashboard:', error);
    }
}

async function fetchTransactions() {
    try {
        const response = await fetch('http://localhost:3000/api/transactions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const transactions = await response.json();
        displayTransactions(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}

function displayTransactions(transactions) {
    const listDiv = document.getElementById('transactionsList');
    
    if (transactions.length === 0) {
        listDiv.innerHTML = '<p class="text-center">No transactions yet. Add your first transaction!</p>';
        return;
    }
    
    listDiv.innerHTML = transactions.map(t => `
        <div class="transaction-item ${t.type}">
            <div class="transaction-details">
                <strong>${t.category}</strong>
                <p>${t.description || 'No description'}</p>
                <small>${new Date(t.date).toLocaleDateString()}</small>
            </div>
            <div class="transaction-amount">
                <span class="${t.type}">${t.type === 'income' ? '+' : '-'}₹${t.amount.toFixed(2)}</span>
                <button onclick="deleteTransaction('${t._id}')" class="btn-delete">Delete</button>
            </div>
        </div>
    `).join('');
}

// Add transaction
document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const transaction = {
        type: document.getElementById('type').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        date: document.getElementById('date').value
    };
    
    try {
        const response = await fetch('http://localhost:3000/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(transaction)
        });
        
        if (response.ok) {
            alert('Transaction added successfully!');
            document.getElementById('transactionForm').reset();
            document.getElementById('date').valueAsDate = new Date();
            fetchDashboard();
            fetchTransactions();
        }
    } catch (error) {
        alert('Error adding transaction');
        console.error(error);
    }
});

// Delete transaction
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/transactions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Transaction deleted successfully!');
            fetchDashboard();
            fetchTransactions();
        }
    } catch (error) {
        alert('Error deleting transaction');
        console.error(error);
    }
}

// Simple chart drawing
function drawCategoryChart(categoryTotals) {
    const canvas = document.getElementById('categoryChart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const categories = Object.keys(categoryTotals);
    if (categories.length === 0) {
        ctx.font = '16px Arial';
        ctx.fillText('No expense data yet', canvas.width / 2 - 70, canvas.height / 2);
        return;
    }
    
    const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    let currentAngle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    
    categories.forEach((category, index) => {
        const percentage = categoryTotals[category] / total;
        const sliceAngle = percentage * 2 * Math.PI;
        
        // Draw slice
        ctx.beginPath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        // Draw label
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
        const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
        
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(`${category} (${(percentage * 100).toFixed(1)}%)`, labelX - 40, labelY);
        
        currentAngle += sliceAngle;
    });
}

// Load data on page load
fetchDashboard();
fetchTransactions();
