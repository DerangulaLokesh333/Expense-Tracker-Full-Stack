
const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const user = await User.create({
            name: name,
            email: email,
            password: password
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

module.exports = router;
