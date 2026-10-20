
const sibApiV3Sdk = require("sib-api-v3-sdk");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const path = require("path");

const User = require("../models/user");
const ForgotPasswordRequests = require("../models/forgotPasswordRequests");

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required."
        });
    }

    try {
        const user = await User.findOne({
            where: { email: email }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const requestId = uuidv4();

        await ForgotPasswordRequests.create({
            id: requestId,
            userId: user.id,
            isActive: true
        });

        const resetUrl =
            `http://localhost:3000/password/resetpassword/${requestId}`;

        const defaultClient = sibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications["api-key"];

        apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

        const transactionalEmailsApi =
            new sibApiV3Sdk.TransactionalEmailsApi();

        const emailContent = {
            sender: {
                email: process.env.SENDINBLUE_SENDER_EMAIL
            },
            to: [{ email: email }],
            subject: "Reset Your Expense Tracker Password",
            textContent:
                `Click this link to reset your password: ${resetUrl}`
        };

        await transactionalEmailsApi.sendTransacEmail(emailContent);

        return res.status(200).json({
            message: "Password reset link sent successfully."
        });
    } catch (error) {
        console.error(
            "Forgot password error:",
            error.response?.body || error.message
        );

        return res.status(500).json({
            message: "Failed to process the password reset request."
        });
    }
};

exports.showResetPasswordPage = async (req, res) => {
    console.log("Reset page route reached:", req.params.id);

    const { id } = req.params;

    try {
        const request = await ForgotPasswordRequests.findOne({
            where: {
                id: id,
                isActive: true
            }
        });

        if (!request) {
            return res.status(400).send("Invalid or expired reset link.");
        }

        return res.sendFile(
            path.join(
                __dirname,
                "../frontend/login/resetPassword.html"
            )
        );
    } catch (error) {
        console.error("Show reset password page error:", error);

        return res.status(500).send("Something went wrong.");
    }
};

exports.resetPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            message: "Password is required."
        });
    }

    try {
        const request = await ForgotPasswordRequests.findOne({
            where: {
                id: id,
                isActive: true
            }
        });

        if (!request) {
            return res.status(400).json({
                message: "Invalid or expired reset link."
            });
        }

        const user = await User.findByPk(request.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await user.update({
            password: hashedPassword
        });

        await request.update({
            isActive: false
        });

        return res.status(200).json({
            message: "Password reset successful."
        });
    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            message: "Failed to reset password."
        });
    }
};
