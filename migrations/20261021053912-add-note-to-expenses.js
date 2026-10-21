


module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("expenses", "note", {
            type: Sequelize.STRING,
            allowNull: true
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("expenses", "note");
    }
};
