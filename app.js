
require("dotenv").config();

const forgotPasswordRoutes = require("./routes/forgotPasswordRoute");
const express = require("express");
const cors = require("cors");
const path = require("path");

const morgan = require("morgan");
const logger = require("./util/logger");

const userRoutes = require("./routes/user");
const expenseRoutes = require("./routes/expense");

const sequelize = require("./util/database");
const User = require("./models/user");
const Expense = require("./models/expense");
const Order = require("./models/order");
const paymentRoutes = require("./routes/payment");
const premiumRoutes = require("./routes/premium");
const reportRoutes = require("./routes/report");
const ForgotPasswordRequests = require("./models/forgotPasswordRequests");

const Report = require("./models/report");

User.hasMany(Expense, { foreignKey: "UserId" });
Expense.belongsTo(User, { foreignKey: "UserId" });

User.hasMany(Report);
Report.belongsTo(User);

User.hasMany(ForgotPasswordRequests);
ForgotPasswordRequests.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

const app = express();

app.use(cors({
    exposedHeaders: ["x-total-count"]
}));
app.use(express.json());

app.use(
    morgan("combined", {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    })
);

app.use(forgotPasswordRoutes);
console.log("Forgot password routes registered");

app.use("/payment", paymentRoutes);
app.use("/premium", premiumRoutes);
app.use("/report", reportRoutes);

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

app.use((err, req, res, next) => {
    logger.error("Request failed", {
        method: req.method,
        url: req.originalUrl,
        error: err.message,
        stack: err.stack
    });

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        message: err.status && err.status < 500
            ? err.message
            : "Internal server error"
    });
});


sequelize
    .sync()
    .then(() => {
        console.log("Database connected and tables synchronized");

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        logger.error("Database connection failed", {
            error: error.message,
            stack: error.stack
        });
    });
