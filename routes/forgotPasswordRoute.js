
const express = require("express");
const router = express.Router();

const forgotPasswordController = require("../controllers/forgotPasswordController");

router.post(
    "/password/forgotpassword",
    forgotPasswordController.forgotPassword
);

router.get(
    "/password/resetpassword/:id",
    forgotPasswordController.showResetPasswordPage
);

router.post(
    "/password/resetpassword/:id",
    forgotPasswordController.resetPassword
);

module.exports = router;
