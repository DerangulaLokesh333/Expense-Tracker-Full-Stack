
const API_URL = "http://localhost:3000/expense";
const PAYMENT_URL = "http://localhost:3000/payment";

const expenseForm = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const message = document.getElementById("message");
const buyPremiumButton = document.getElementById("buy-premium");

function getToken() {
    return localStorage.getItem("token");
}

// Fetch and display expenses
async function getExpenses() {
    try {
        const response = await fetch(`${API_URL}/get-expense`, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        const expenses = await response.json();

        if (!response.ok) {
            throw new Error(expenses.message || "Failed to fetch expenses");
        }

        displayExpense(expenses);
    } catch (error) {
        console.error("Fetch expenses error:", error);
        message.textContent = error.message;
    }
}

// Display expenses in the list
function displayExpense(expenses) {
    expenseList.innerHTML = "";

    expenses.forEach((expense) => {
        const li = document.createElement("li");
        li.textContent =
            `${expense.amount} - ${expense.category} - ${expense.description} `;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete Expense";

        deleteButton.addEventListener("click", () => {
            deleteExpense(expense.id);
        });

        li.appendChild(deleteButton);
        expenseList.appendChild(li);
    });
}

// Add an expense
expenseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const amount = document.getElementById("expenseamount").value;
        const description = document.getElementById("description").value;
        const category = document.getElementById("category").value;

        const response = await fetch(`${API_URL}/add-expense`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                amount,
                description,
                category
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to add expense");
        }

        message.textContent = "Expense added successfully.";
        expenseForm.reset();
        getExpenses();
    } catch (error) {
        console.error("Add expense error:", error);
        message.textContent = error.message;
    }
});

// Delete an expense
async function deleteExpense(id) {
    try {
        const response = await fetch(`${API_URL}/delete-expense/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to delete expense");
        }

        message.textContent = "Expense deleted successfully.";
        getExpenses();
    } catch (error) {
        console.error("Delete expense error:", error);
        message.textContent = error.message;
    }
}

// Create Cashfree order and open checkout
buyPremiumButton.addEventListener("click", async () => {
    try {
        buyPremiumButton.disabled = true;
        message.textContent = "Creating payment order...";

        const response = await fetch(`${PAYMENT_URL}/create-order`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Failed to create payment order"
            );
        }

        if (!result.paymentSessionId) {
            throw new Error("Payment session ID was not returned by the server.");
        }

        const cashfree = Cashfree({
            mode: "sandbox"
        });

        message.textContent = "Opening Cashfree checkout...";

        await cashfree.checkout({
            paymentSessionId: result.paymentSessionId,
            redirectTarget: "_self"
        });
    } catch (error) {
        console.error("Payment error:", error);
        message.textContent = error.message || "TRANSACTION FAILED";
    } finally {
        buyPremiumButton.disabled = false;
    }
});

// Load expenses when the page opens
getExpenses();
