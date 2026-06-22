const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    data: {
        name: 'giveawaystop',
        description: 'Stop an ongoing giveaway!',
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

            const endEmbed = new EmbedBuilder()
                .setTitle('🎉 GIVEAWAY ENDED 🎉')
                .setDescription(`The giveaway for: **${giveawayMessage.embeds[0].description}** has been stopped.`)
                .setColor(Colors.Red) // Using Discord.js color constant
                .setTimestamp();

            await interaction.channel.send({ embeds: [endEmbed] });
            await interaction.reply({ content: 'Giveaway has been stopped!', ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error fetching the message or stopping the giveaway.', ephemeral: true });
        }
    },
};
