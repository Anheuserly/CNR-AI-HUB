const { EmbedBuilder, Colors } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: {
        name: 'giveaway',
        description: 'Start a giveaway!',
        options: [
            {
                name: 'duration',
                type: 3, // STRING type in the new API
                description: 'The duration of the giveaway (e.g., 10m, 1h, 1d)',
                required: true,
            },
            {
                name: 'prize',
                type: 3, // STRING type in the new API
                description: 'The prize for the giveaway',
                required: true,
            },
            {
                name: 'winners',
                type: 4, // INTEGER type for number of winners
                description: 'Number of winners for the giveaway',
                required: true,
            },
        ],
    },

    async execute(interaction) {
        // Get the duration, prize, and number of winners from the interaction
        const duration = interaction.options.getString('duration');
        const prize = interaction.options.getString('prize');
        const winnersCount = interaction.options.getInteger('winners');

        // Validate the duration format
        if (!ms(duration)) {
            return interaction.reply({ content: 'Please provide a valid duration! Example: `10m`, `1h`, `1d`', ephemeral: true });
        }

        // Create the giveaway embed
        const giveawayEmbed = new EmbedBuilder()
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(`**Prize:** ${prize}\n**Winners:** ${winnersCount}\nReact with 🎉 to enter!\n**Time remaining:** ${ms(ms(duration), { long: true })}`)
            .setColor(Colors.Blue) // Using Discord.js color constant
            .setTimestamp();

        // Send the giveaway message
        const giveawayMessage = await interaction.channel.send({ embeds: [giveawayEmbed] });

        // React to the message with 🎉
        await giveawayMessage.react('🎉');

        // Set a timeout for the giveaway duration
        setTimeout(async () => {
            // Fetch the message again to ensure we have the latest data
            const fetchedMessage = await interaction.channel.messages.fetch(giveawayMessage.id);
            const users = await fetchedMessage.reactions.cache.get('🎉').users.fetch();
            users.delete(interaction.client.user.id); // Remove the bot from the list

            // Select winners
            const winners = users.size > 0 ? users.random(winnersCount) : [];
            const winnersTags = winners.length > 0 ? winners.map(user => user.tag).join(', ') : 'No one';

            const endEmbed = new EmbedBuilder()
                .setTitle('🎉 GIVEAWAY ENDED 🎉')
                .setDescription(`**Prize:** ${prize}\n**Winners:** ${winnersTags}`)
                .setColor(Colors.Red) // Using Discord.js color constant
                .setTimestamp();

            await interaction.channel.send({ embeds: [endEmbed] });

        }, ms(duration));

        // Confirmation message to the user
        await interaction.reply(`Giveaway started for **${prize}**! Duration: **${ms(ms(duration), { long: true })}** with **${winnersCount}** winner(s).`);
    },
};
