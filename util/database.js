const Sequelize = require("sequelize");

const sequelize = new Sequelize("expense_app", "root", "Lokesh@333", {
    dialect: "mysql",
    host: "localhost"
});

module.exports = sequelize;