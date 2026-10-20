
const sibApiV3Sdk = require("sib-api-v3-sdk");

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required."
        });
    }

    const defaultClient = sibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications["api-key"];

    apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

    const transactionalEmailsApi =
        new sibApiV3Sdk.TransactionalEmailsApi();

    const sender = {
        email: process.env.SENDINBLUE_SENDER_EMAIL
    };

    const receiver = [
        {
            email: email
        }
    ];

    const emailContent = {
        sender: sender,
        to: receiver,
        subject: "Forgot Password - Expense Tracker",
        textContent:
            "This is a test email from your Expense Tracker application."
    };

    try {
        await transactionalEmailsApi.sendTransacEmail(emailContent);

        return res.status(200).json({
            message: "Email sent successfully."
        });
    } catch (error) {
        console.error(
            "Error sending email:",
            error.response?.body || error.message
        );

        return res.status(500).json({
            message: "Failed to send email. Please try again later."
        });
    }
};
