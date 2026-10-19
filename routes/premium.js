
const express = require("express");
const router = express.Router();

const sequelize = require("../util/database");
const { QueryTypes } = require("sequelize");
const { authenticateUser } = require("../middleware/auth");

// Show leaderboard using a single SQL query
router.get("/show-leaderboard", authenticateUser, async (req, res) => {
    try {
        const leaderboard = await sequelize.query(
            `SELECT
                users.id AS userId,
                users.name AS name,
                COALESCE(SUM(expenses.amount), 0) AS totalExpenses
            FROM users
            LEFT JOIN expenses
                ON users.id = expenses.UserId
            GROUP BY users.id, users.name
            ORDER BY totalExpenses DESC`,
            {
                type: QueryTypes.SELECT
            }
        );

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error("Leaderboard error:", error);

        res.status(500).json({
            message: "Failed to fetch leaderboard"
        });
    }
});

module.exports = router;
