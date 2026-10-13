const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name,
            email: email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User signup successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(403).json({
                message: "Email already exists"
            });
        }

        console.error(error);
        res.status(500).json({
            message: "Something went wrong"
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email: email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password"
            });
        }

        res.status(200).json({
            success: true,
            message: "User logged in successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
});

module.exports = router;
