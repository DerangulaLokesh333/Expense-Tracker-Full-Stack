
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user");
const sequelize = require("./util/database");
const User = require("./models/user");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/user", userRoutes);

sequelize
    .sync()
    .then(() => {
        console.log("Database connected and tables synchronized");

        app.listen(3000, () => {
            console.log("Server running on port 3000");
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
    });
