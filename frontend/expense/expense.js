
const API_URL = "http://localhost:3000/expense";
const PAYMENT_URL = "http://localhost:3000/payment";
const USER_URL = "http://localhost:3000/user";
const PREMIUM_URL = "http://localhost:3000/premium";

const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_PAGE_SIZES = [5, 10, 20, 40];

const expenseForm = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const message = document.getElementById("message");
const buyPremiumButton = document.getElementById("buy-premium");
const premiumMessage = document.getElementById("premium-message");
const leaderboardButton = document.getElementById("leaderboard-button");
const leaderboardContainer = document.getElementById("leaderboard-container");
const leaderboardList = document.getElementById("leaderboard-list");

// Pagination elements
const previousPageButton = document.getElementById("previous-page");
const nextPageButton = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");
const pageSizeSelect = document.getElementById("page-size");

let currentPage = 1;
let totalPages = 1;
let totalExpenses = 0;

const savedPageSize = Number(localStorage.getItem("expensePageSize"));

let pageSize = ALLOWED_PAGE_SIZES.includes(savedPageSize)
    ? savedPageSize
    : DEFAULT_PAGE_SIZE;

// Report elements
const timePeriod = document.getElementById("time-period");
const downloadButton = document.getElementById("download-button");
const reportTableBody = document.getElementById("report-table-body");
const reportMessage = document.getElementById("report-message");

let allExpenses = [];
let isPremiumUser = false;

// Restore the selected page size in the dropdown
if (pageSizeSelect) {
    pageSizeSelect.value = String(pageSize);
}

function getToken() {
    return localStorage.getItem("token");
}

// Fetch and display the logged-in user's premium status
async function getUserProfile() {
    try {
        const response = await fetch(`${USER_URL}/profile`, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        const user = await response.json();

        if (!response.ok) {
            throw new Error(user.message || "Failed to fetch user profile");
        }

        isPremiumUser = Boolean(user.isPremium);

        if (isPremiumUser) {
            premiumMessage.textContent = "You are a premium user now";
            buyPremiumButton.hidden = true;
            leaderboardButton.hidden = false;

            downloadButton.disabled = false;
            reportMessage.textContent = "Download your expenses report.";
        } else {
            premiumMessage.textContent = "";
            buyPremiumButton.hidden = false;
            leaderboardButton.hidden = true;

            downloadButton.disabled = true;
            reportMessage.textContent = "Only for Premium Users";
        }
    } catch (error) {
        console.error("Profile error:", error);
        isPremiumUser = false;
        downloadButton.disabled = true;
        reportMessage.textContent = "Only for Premium Users";
    }
}

// Fetch and display one page of expenses
async function getExpenses(page = currentPage) {
    try {
        const response = await fetch(
            `${API_URL}/get-expense?_page=${page}&_limit=${pageSize}`,
            {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            }
        );

        const expenses = await response.json();

        if (!response.ok) {
            throw new Error(expenses.message || "Failed to fetch expenses");
        }

        totalExpenses = Number(
            response.headers.get("x-total-count") || 0
        );

        totalPages = Math.max(
            1,
            Math.ceil(totalExpenses / pageSize)
        );

        // If the requested page no longer exists, load the last valid page
        if (page > totalPages) {
            return getExpenses(totalPages);
        }

        currentPage = page;
        allExpenses = expenses;

        displayExpense(allExpenses);
        renderReport(allExpenses);
        updatePagination();
    } catch (error) {
        console.error("Fetch expenses error:", error);
        message.textContent = error.message;
    }
}

// Update pagination information and buttons

function updatePagination() {
    if (totalExpenses === 0) {
        pageInfo.textContent = "Page 1 of 1 (0 expenses)";
    } else {
        const start = (currentPage - 1) * pageSize + 1;
        const end = Math.min(currentPage * pageSize, totalExpenses);

        pageInfo.textContent =
            `${start}-${end} of ${totalExpenses} expenses`;
    }

    previousPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;
}


// Change the selected number of expenses per page
if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", async () => {
        const selectedSize = Number(pageSizeSelect.value);

        if (!ALLOWED_PAGE_SIZES.includes(selectedSize)) {
            pageSizeSelect.value = String(pageSize);
            return;
        }

        pageSize = selectedSize;
        localStorage.setItem("expensePageSize", String(pageSize));

        // Start from page 1 when the page size changes
        await getExpenses(1);
    });
}

// Go to the previous page
previousPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
        getExpenses(currentPage - 1);
    }
});

// Go to the next page
nextPageButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
        getExpenses(currentPage + 1);
    }
});

// Display expenses
function displayExpense(expenses) {
    expenseList.innerHTML = "";

    if (expenses.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No expenses found.";
        expenseList.appendChild(li);
        return;
    }

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

// Get expenses matching the selected time period
function getFilteredExpenses(expenses) {
    const selectedPeriod = timePeriod.value;
    const now = new Date();

    if (selectedPeriod === "all") {
        return expenses;
    }

    return expenses.filter((expense) => {
        const expenseDate = new Date(expense.createdAt);

        if (Number.isNaN(expenseDate.getTime())) {
            return false;
        }

        if (selectedPeriod === "daily") {
            return expenseDate.toDateString() === now.toDateString();
        }

        if (selectedPeriod === "weekly") {
            const startOfWeek = new Date(now);
            startOfWeek.setHours(0, 0, 0, 0);

            const day = startOfWeek.getDay();
            const daysFromMonday = (day + 6) % 7;

            startOfWeek.setDate(
                startOfWeek.getDate() - daysFromMonday
            );

            const startOfNextWeek = new Date(startOfWeek);
            startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

            return (
                expenseDate >= startOfWeek &&
                expenseDate < startOfNextWeek
            );
        }

        if (selectedPeriod === "monthly") {
            return (
                expenseDate.getFullYear() === now.getFullYear() &&
                expenseDate.getMonth() === now.getMonth()
            );
        }

        return true;
    });
}

// Display the report table
function renderReport(expenses) {
    reportTableBody.innerHTML = "";

    const filteredExpenses = getFilteredExpenses(expenses);

    if (filteredExpenses.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "No expenses found for this period.";

        row.appendChild(cell);
        reportTableBody.appendChild(row);
        return;
    }

    filteredExpenses.forEach((expense) => {
        const row = document.createElement("tr");
        const expenseDate = new Date(expense.createdAt);

        const dateCell = document.createElement("td");
        dateCell.textContent = Number.isNaN(expenseDate.getTime())
            ? "—"
            : expenseDate.toLocaleDateString();

        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = expense.description || "—";

        const categoryCell = document.createElement("td");
        categoryCell.textContent = expense.category || "—";

        const incomeCell = document.createElement("td");
        incomeCell.textContent = "—";

        const expenseCell = document.createElement("td");
        expenseCell.textContent = expense.amount ?? "—";

        row.append(
            dateCell,
            descriptionCell,
            categoryCell,
            incomeCell,
            expenseCell
        );

        reportTableBody.appendChild(row);
    });
}

// Update report when the selected period changes
timePeriod.addEventListener("change", () => {
    renderReport(allExpenses);
});

// Download the filtered report as CSV
downloadButton.addEventListener("click", () => {
    if (!isPremiumUser) {
        reportMessage.textContent = "Only for Premium Users";
        downloadButton.disabled = true;
        return;
    }

    const filteredExpenses = getFilteredExpenses(allExpenses);

    if (filteredExpenses.length === 0) {
        reportMessage.textContent = "No expenses available to download.";
        return;
    }

    const headers = [
        "Date",
        "Description",
        "Category",
        "Income",
        "Expense"
    ];

    const rows = filteredExpenses.map((expense) => {
        const expenseDate = new Date(expense.createdAt);

        return [
            Number.isNaN(expenseDate.getTime())
                ? ""
                : expenseDate.toLocaleDateString(),
            expense.description || "",
            expense.category || "",
            "",
            expense.amount ?? ""
        ];
    });

    const escapeCSV = (value) => {
        const text = String(value);
        return `"${text.replace(/"/g, '""')}"`;
    };

    const csvContent = [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "expense-report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    reportMessage.textContent = "Expense report downloaded successfully.";
});

// Add an expense
expenseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const amount = document.getElementById("expenseamount").value;
        const description = document.getElementById("description").value.trim();

        if (!amount || !description) {
            message.textContent = "Please enter the amount and description.";
            return;
        }

        message.textContent = "Adding expense and generating category...";

        const response = await fetch(`${API_URL}/add-expense`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                amount,
                description
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to add expense");
        }

        message.textContent =
            `Expense added successfully. Category: ${result.expense.category}`;

        expenseForm.reset();

        // Newest expenses appear on page 1
        await getExpenses(1);
    } catch (error) {
        console.error("Add expense error:", error);
        message.textContent = error.message;
    }
});

// Delete an expense and refresh the current page
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

        // getExpenses moves back if this page no longer exists
        await getExpenses(currentPage);
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

// Fetch and display leaderboard
async function showLeaderboard() {
    try {
        leaderboardButton.disabled = true;
        leaderboardContainer.hidden = false;
        leaderboardList.innerHTML = "Loading leaderboard...";

        const response = await fetch(
            `${PREMIUM_URL}/show-leaderboard`,
            {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch leaderboard");
        }

        leaderboardList.innerHTML = "";

        data.forEach((user) => {
            const li = document.createElement("li");
            li.textContent =
                `${user.name} - Total Expenses: ₹${user.totalExpenses}`;
            leaderboardList.appendChild(li);
        });
    } catch (error) {
        console.error("Leaderboard error:", error);
        leaderboardList.textContent = error.message;
    } finally {
        leaderboardButton.disabled = false;
    }
}

leaderboardButton.addEventListener("click", showLeaderboard);

// Load data when the page opens
getUserProfile();
getExpenses();
