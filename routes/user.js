
const express = require("express");

const router = express.Router();

router.post("/signup", (req, res) => {
    const { name, email, password } = req.body;

    res.status(201).json({
        message: "User signup successful",
        user: {
            name: name,
            email: email
        }
    });
});

module.exports = router;
