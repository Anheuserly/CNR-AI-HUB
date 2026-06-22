const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'giveawayreroll',
    description: 'Reroll the giveaway winner.',

    async execute(message) {
        // Get the last giveaway message with the 🎉 reaction
        const fetchedMessages = await message.channel.messages.fetch({ limit: 10 });
        const giveawayMessage = fetchedMessages.find(msg => msg.embeds[0] && msg.embeds[0].title === '🎉 GIVEAWAY 🎉');

        if (!giveawayMessage) {
            return message.reply('No giveaway found to reroll.');
        }

        const users = await giveawayMessage.reactions.cache.get('🎉').users.fetch();
        users.delete(message.client.user.id); // Remove the bot from the list

        // Select a random winner
        const winner = users.size > 0 ? users.random() : null;

        const rerollEmbed = new EmbedBuilder()
            .setTitle('🎉 GIVEAWAY REROLLED 🎉')
            .setDescription(`New Winner: **${winner ? winner.tag : 'No one'}**`)
            .setColor('BLUE')
            .setTimestamp();

        await message.channel.send({ embeds: [rerollEmbed] });
    },
};
