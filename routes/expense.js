
const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const sequelize = require("../util/database");
const Expense = require("../models/expense");
const User = require("../models/user");
const { authenticateUser } = require("../middleware/auth");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Generate expense category using Gemini
async function generateCategory(description) {
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Categorize this expense description: "${description}".

Examples:
Milk -> Groceries
Shoes -> Footwear
Bus ticket -> Transport
Doctor appointment -> Healthcare
Petrol -> Fuel
Restaurant meal -> Food

Return only one short category name. Do not include explanations.`
    });

    const category = response.text?.trim();

    if (!category) {
        throw new Error("Gemini did not return an expense category");
    }

    return category;
}

// Add expense
router.post("/add-expense", authenticateUser, async (req, res) => {
    let t;

    try {
        const { amount, description } = req.body;

        if (
            amount === undefined ||
            amount === null ||
            amount === "" ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0 ||
            typeof description !== "string" ||
            !description.trim()
        ) {
            return res.status(400).json({
                message: "A valid amount and description are required"
            });
        }

        const category = await generateCategory(description.trim());

        t = await sequelize.transaction();

        const expense = await Expense.create(
            {
                amount: Number(amount),
                description: description.trim(),
                category,
                UserId: req.user.id
            },
            { transaction: t }
        );

        await User.increment(
            { totalExpense: Number(amount) },
            {
                where: { id: req.user.id },
                transaction: t
            }
        );

        await t.commit();

        return res.status(201).json({
            message: "Expense added successfully",
            expense
        });
    } catch (error) {
        if (t && !t.finished) {
            try {
                await t.rollback();
            } catch (rollbackError) {
                console.error("Add expense rollback error:", rollbackError);
            }
        }

        console.error("Add expense error:", error);
        return res.status(500).json({
            message: "Failed to add expense or generate category"
        });
    }
});

// Get logged-in user's expenses with pagination
router.get("/get-expense", authenticateUser, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query._page, 10) || 1);
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Expense.findAndCountAll({
            where: { UserId: req.user.id },
            order: [["createdAt", "DESC"]],
            limit,
            offset
        });

        res.setHeader("x-total-count", count);

        return res.status(200).json(rows);
    } catch (error) {
        console.error("Get expenses error:", error);
        return res.status(500).json({
            message: "Failed to fetch expenses"
        });
    }
});

// Delete expense by ID, only if it belongs to the logged-in user
router.delete("/delete-expense/:id", authenticateUser, async (req, res) => {
    let t;

    try {
        t = await sequelize.transaction();

        const expense = await Expense.findOne({
            where: {
                id: req.params.id,
                UserId: req.user.id
            },
            transaction: t
        });

        if (!expense) {
            await t.rollback();

            return res.status(404).json({
                message: "Expense not found"
            });
        }

        await expense.destroy({ transaction: t });

        await User.decrement(
            { totalExpense: expense.amount },
            {
                where: { id: req.user.id },
                transaction: t
            }
        );

        await t.commit();

        return res.status(200).json({
            message: "Expense deleted successfully"
        });
    } catch (error) {
        if (t && !t.finished) {
            try {
                await t.rollback();
            } catch (rollbackError) {
                console.error("Delete expense rollback error:", rollbackError);
            }
        }

        console.error("Delete expense error:", error);
        return res.status(500).json({
            message: "Failed to delete expense"
        });
    }
});

module.exports = router;
