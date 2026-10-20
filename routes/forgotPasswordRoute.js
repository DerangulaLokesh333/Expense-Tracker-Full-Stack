const express = require("express");
const router = express.Router();

const forgotPasswordController = require("../controllers/forgotPasswordController");

router.post(
    "/password/forgotpassword",
    forgotPasswordController.forgotPassword
);

module.exports = router;