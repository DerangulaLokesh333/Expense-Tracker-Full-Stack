
const express = require("express");
const router = express.Router();

const User = require("../models/user");
const { authenticateUser } = require("../middleware/auth");

router.get("/show-leaderboard", authenticateUser, async (req, res) => {
    try {
        const leaderboard = await User.findAll({
            attributes: ["id", "name", "totalExpense"],
            order: [["totalExpense", "DESC"]]
        });

        res.status(200).json(
            leaderboard.map(user => ({
                userId: user.id,
                name: user.name,
                totalExpenses: Number(user.totalExpense)
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
