
const express = require("express");
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const Expense = require("../models/expense");
const User = require("../models/user");
const Report = require("../models/report");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

const s3 = new S3Client({
    region: process.env.AWS_REGION
});

function escapeCsv(value) {
    const text = value == null ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

// Generate and download an expense report
router.post("/generate", authenticateUser, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.isPremium) {
            return res.status(401).json({
                message: "Only premium users can download expense reports"
            });
        }

        const expenses = await Expense.findAll({
            where: { UserId: req.user.id },
            order: [["createdAt", "DESC"]]
        });

        const headers = ["Date", "Description", "Category", "Amount"];

        const rows = expenses.map((expense) => [
            expense.createdAt,
            expense.description,
            expense.category,
            expense.amount
        ]);

        const csv = [
            headers.map(escapeCsv).join(","),
            ...rows.map((row) => row.map(escapeCsv).join(","))
        ].join("\n");

        const bucket = process.env.AWS_S3_BUCKET;

        const fileKey =
            `expense-reports/user-${req.user.id}/expense-report-${Date.now()}.csv`;

        await s3.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: fileKey,
                Body: csv,
                ContentType: "text/csv; charset=utf-8"
            })
        );

        const fileUrl =
            `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        await Report.create({
            fileUrl,
            fileKey,
            userId: req.user.id
        });

        const downloadUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
                Bucket: bucket,
                Key: fileKey
            }),
            { expiresIn: 3600 }
        );

        return res.status(200).json({
            message: "Expense report generated successfully",
            downloadUrl
        });
    } catch (error) {
        console.error("Report generation failed:", error.message);

        return res.status(500).json({
            message: "Unable to generate expense report"
        });
    }
});

// Get the current user's report history
router.get("/history", authenticateUser, async (req, res) => {
    try {
        const reports = await Report.findAll({
            where: { userId: req.user.id },
            order: [["createdAt", "DESC"]]
        });

        const history = await Promise.all(
            reports.map(async (report) => ({
                id: report.id,
                createdAt: report.createdAt,
                downloadUrl: await getSignedUrl(
                    s3,
                    new GetObjectCommand({
                        Bucket: process.env.AWS_S3_BUCKET,
                        Key: report.fileKey
                    }),
                    { expiresIn: 3600 }
                )
            }))
        );

        return res.status(200).json(history);
    } catch (error) {
        console.error("Report history failed:", error.message);

        return res.status(500).json({
            message: "Unable to load report history"
        });
    }
});

module.exports = router;
