
const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const Order = sequelize.define("order", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    orderId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    orderAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
    },
    orderStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "PENDING"
    }
});

module.exports = Order;
