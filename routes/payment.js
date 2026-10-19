
const express = require("express");
const router = express.Router();

const { Cashfree } = require("cashfree-pg");
const { authenticateUser } = require("../middleware/auth");
const User = require("../models/user");
const Order = require("../models/order");

const cashfree = new Cashfree(
    Cashfree.SANDBOX,
    process.env.CASHFREE_CLIENT_ID,
    process.env.CASHFREE_CLIENT_SECRET
);

// Create Cashfree payment order
router.post("/create-order", authenticateUser, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const orderId = `order_${Date.now()}_${user.id}`;
        const orderAmount = 100;

        const request = {
            order_id: orderId,
            order_amount: orderAmount,
            order_currency: "INR",
            customer_details: {
                customer_id: String(user.id),
                customer_name: user.name,
                customer_email: user.email,
                customer_phone: "9999999999"
            },
            order_meta: {
                return_url: `http://localhost:3000/payment/payment-status?order_id=${orderId}`
            }
        };

        const response = await cashfree.PGCreateOrder(request);

        await Order.create({
            orderId: orderId,
            orderAmount: orderAmount,
            orderStatus: "PENDING",
            userId: user.id
        });

        res.status(201).json({
            message: "Order created successfully",
            orderId: orderId,
            paymentSessionId: response.data.payment_session_id
        });
    } catch (error) {
        console.error(
            "Cashfree order creation failed:",
            error.response?.data || error.message
        );

        res.status(500).json({
            message: "Failed to create payment order"
        });
    }
});

// Handle Cashfree return and verify payment
router.get("/payment-status", async (req, res) => {
    try {
        const orderId = req.query.order_id;

        if (!orderId) {
            return res.status(400).send("Order ID is missing.");
        }

        const order = await Order.findOne({
            where: { orderId: orderId }
        });

        if (!order) {
            return res.status(404).send("Order not found.");
        }

        // Fetch payments from Cashfree for this order
        const response = await cashfree.PGOrderFetchPayments(orderId);
        const payments = response.data;

        const successfulPayment = payments.find(
            payment => payment.payment_status === "SUCCESS"
        );

        if (successfulPayment) {
            order.orderStatus = "SUCCESSFUL";
            await order.save();

            const user = await User.findByPk(order.userId);

            if (user) {
                user.isPremium = true;
                await user.save();
            }

            return res.send(
                "Payment Successful! Premium membership activated."
            );
        }

        const failedPayment = payments.find(
            payment => payment.payment_status === "FAILED"
        );

        if (failedPayment) {
            order.orderStatus = "FAILED";
            await order.save();

            return res.status(200).send("TRANSACTION FAILED");
        }

        return res.send(
            "Payment is still pending. Please check again."
        );
    } catch (error) {
        console.error(
            "Payment verification failed:",
            error.response?.data || error.message
        );

        return res.status(500).send(
            "Unable to verify payment. Please try again."
        );
    }
});

module.exports = router;
