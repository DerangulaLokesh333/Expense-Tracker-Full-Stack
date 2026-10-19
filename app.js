
const express = require("express");
const cors = require("cors");
const path = require("path");

const userRoutes = require("./routes/user");
const expenseRoutes = require("./routes/expense");

const sequelize = require("./util/database");
const User = require("./models/user");
const Expense = require("./models/expense");
const Order = require("./models/order");
const paymentRoutes = require("./routes/payment");

User.hasMany(Expense, { foreignKey: "UserId" });
Expense.belongsTo(User, { foreignKey: "UserId" });

User.hasMany(Order);
Order.belongsTo(User);

const app = express();

app.use(cors());
app.use(express.json());
app.use("/payment", paymentRoutes);

app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "frontend", "signup", "signup.html")
    );
});

app.get("/login", (req, res) => {
    res.sendFile(
        path.join(__dirname, "frontend", "login", "login.html")
    );
});

app.get("/expense", (req, res) => {
    res.sendFile(
        path.join(__dirname, "frontend", "expense", "expense.html")
    );
});

app.use("/user", userRoutes);
app.use("/expense", expenseRoutes);

sequelize
    .sync()
    .then(() => {
        console.log("Database connected and tables synchronized");

        app.listen(3000, () => {
            console.log("Server running on port 3000");
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
    });
