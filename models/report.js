
const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const Report = sequelize.define("report", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    fileUrl: {
        type: Sequelize.STRING,
        allowNull: false
    },
    fileKey: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Report;
