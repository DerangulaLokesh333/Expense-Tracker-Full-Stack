
const API_URL = "http://localhost:3000/expense";

const expenseForm = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const message = document.getElementById("message");

// Get the JWT token saved after login
function getToken() {
    return localStorage.getItem("token");
}

// Fetch and display saved expenses
async function getExpenses() {
    try {
        const response = await fetch(`${API_URL}/get-expense`, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch expenses");
        }

        const expenses = await response.json();
        expenseList.innerHTML = "";

        expenses.forEach(displayExpense);
    } catch (error) {
        console.error(error);
        message.textContent = error.message || "Could not load expenses.";
    }
}

// Display one expense
function displayExpense(expense) {
    const listItem = document.createElement("li");

    listItem.appendChild(
        document.createTextNode(
            `${expense.amount} - ${expense.category} - ${expense.description} `
        )
    );

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete Expense";

    deleteButton.addEventListener("click", () => {
        deleteExpense(expense.id);
    });

    listItem.appendChild(deleteButton);
    expenseList.appendChild(listItem);
}

// Add a new expense
expenseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const expenseData = {
        amount: Number(document.getElementById("expenseamount").value),
        description: document.getElementById("description").value.trim(),
        category: document.getElementById("category").value
    };

    try {
        const response = await fetch(`${API_URL}/add-expense`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify(expenseData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to add expense");
        }

        message.textContent = "Expense added successfully!";
        expenseForm.reset();

        await getExpenses();
    } catch (error) {
        console.error(error);
        message.textContent = error.message;
    }
});

// Delete an expense by its ID
async function deleteExpense(id) {
    try {
        const response = await fetch(
            `${API_URL}/delete-expense/${id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to delete expense");
        }

        message.textContent = "Expense deleted successfully!";
        await getExpenses();
    } catch (error) {
        console.error(error);
        message.textContent = error.message;
    }
}

// Load saved expenses when the page opens or refreshes
getExpenses();
