const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    data: {
        name: 'giveawayreroll',
        description: 'Reroll the giveaway winner!',
        options: [
            {
                name: 'message_id',
                type: 3, // STRING type
                description: 'The ID of the giveaway message',
                required: true,
            },
        ],
    },

    async execute(interaction) {
        const messageId = interaction.options.getString('message_id');

        try {
            const giveawayMessage = await interaction.channel.messages.fetch(messageId);
            const users = await giveawayMessage.reactions.cache.get('🎉').users.fetch();
            users.delete(interaction.client.user.id); // Remove the bot from the list

            // Select a random winner
            const winner = users.size > 0 ? users.random() : null;

            const resultEmbed = new EmbedBuilder()
                .setTitle('🎉 GIVEAWAY REROLLED 🎉')
                .setDescription(`New Winner for **${giveawayMessage.embeds[0].description}**: **${winner ? winner.tag : 'No one'}**`)
                .setColor(Colors.Green) // Using Discord.js color constant
                .setTimestamp();

            await interaction.reply({ embeds: [resultEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error fetching the message or processing the giveaway.', ephemeral: true });
        }
    },
};
