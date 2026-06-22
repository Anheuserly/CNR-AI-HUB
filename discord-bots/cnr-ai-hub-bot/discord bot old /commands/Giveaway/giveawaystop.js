const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'giveawaystop',
    description: 'Stops an ongoing giveaway.',
    activeGiveawayTimeout: null, // Store the active timeout so it can be stopped

    async execute(message) {
        if (!this.activeGiveawayTimeout) {
            return message.reply('No active giveaway to stop.');
        }

        // Clear the active giveaway timeout
        clearTimeout(this.activeGiveawayTimeout);
        this.activeGiveawayTimeout = null;

        const embed = new EmbedBuilder()
            .setTitle('🎉 GIVEAWAY STOPPED 🎉')
            .setDescription('The giveaway has been stopped.')
            .setColor('RED')
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
    },
};
