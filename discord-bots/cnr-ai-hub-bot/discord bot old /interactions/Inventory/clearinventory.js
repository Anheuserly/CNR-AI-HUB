const { EmbedBuilder } = require('discord.js');
const profileManager = require('../../utils/profileManager');

module.exports = {
    name: 'clearinventory',
    description: 'Clear all items from your inventory.',

    async execute(message) {
        const userId = message.member.id;

        // Clear the user's inventory
        try {
            await profileManager.clearUserInventory(userId);
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Inventory Cleared')
                .setDescription('Your inventory has been successfully cleared.')
                .setColor('#FF0000');
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error clearing inventory:', error);
            await message.channel.send('⚠️ An error occurred while trying to clear your inventory. Please try again later.');
        }
    },
};
