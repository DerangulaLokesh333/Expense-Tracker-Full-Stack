
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user");

const app = express();

app.use(cors());
app.use(express.json());

// Connect user routes
app.use("/user", userRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
