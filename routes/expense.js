
const express = require("express");
const router = express.Router();
const Expense = require("../models/expense");
const { authenticateUser } = require("../middleware/auth");

// Add expense
router.post("/add-expense", authenticateUser, async (req, res) => {
    try {
        const { amount, description, category } = req.body;

        const expense = await Expense.create({
            amount,
            description,
            category,
            UserId: req.user.id
        });

        res.status(201).json({
            message: "Expense added successfully",
            expense
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to add expense"
        });
    }
});

// Get logged-in user's expenses
router.get("/get-expense", authenticateUser, async (req, res) => {
    try {
        const expenses = await Expense.findAll({
            where: { UserId: req.user.id },
            order: [["createdAt", "DESC"]]
        });

        res.status(200).json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch expenses"
        });
    }
});

// Delete expense by ID, only if it belongs to the logged-in user
router.delete("/delete-expense/:id", authenticateUser, async (req, res) => {
    try {
        const id = req.params.id;

        const deletedRows = await Expense.destroy({
            where: {
                id,
                UserId: req.user.id
            }
        });

        if (deletedRows === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.status(200).json({
            message: "Expense deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to delete expense"
        });
    }
});

module.exports = router;
