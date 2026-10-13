
const express = require("express");
const router = express.Router();
const Expense = require("../models/expense");

// Add expense
router.post("/add-expense", async (req, res) => {
    try {
        const { amount, description, category } = req.body;

const expense = await Expense.create({
    amount,
    description,
    category
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

// Get all expenses
router.get("/get-expense", async (req, res) => {
    try {
        const expenses = await Expense.findAll({
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

// Delete expense by ID
router.delete("/delete-expense/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const deletedRows = await Expense.destroy({
            where: { id }
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
