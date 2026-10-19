const express = require("express");
const router = express.Router();

const User = require("../models/user");
const Expense = require("../models/expense");
const sequelize = require("../util/database");
const { authenticateUser } = require("../middleware/auth");

router.get("/show-leaderboard", authenticateUser, async (req, res) => {
    try {
        const leaderboard = await User.findAll({
            attributes: [
                "id",
                "name",
                [
                    sequelize.literal(`(
                        SELECT COALESCE(SUM(amount), 0)
                        FROM expenses
                        WHERE expenses.UserId = User.id
                    )`),
                    "totalExpenses"
                ]
            ],
            include: [
                {
                    model: Expense,
                    attributes: []
                }
            ],
            order: [[sequelize.literal("totalExpenses"), "DESC"]]
        });

        res.status(200).json(
            leaderboard.map(user => ({
                userId: user.id,
                name: user.name,
                totalExpenses: Number(user.getDataValue("totalExpenses"))
            }))
        );
    } catch (error) {
        console.error("Leaderboard error:", error);

        res.status(500).json({
            message: "Failed to fetch leaderboard"
        });
    }
});

module.exports = router;