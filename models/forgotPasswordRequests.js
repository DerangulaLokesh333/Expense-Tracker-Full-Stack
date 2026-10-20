const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const ForgotPasswordRequests = sequelize.define("ForgotPasswordRequest", {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
});

module.exports = ForgotPasswordRequests;