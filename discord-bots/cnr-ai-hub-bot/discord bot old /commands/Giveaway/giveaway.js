const { EmbedBuilder, Colors } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'giveaway',
    description: 'Start a giveaway!',
    async execute(message, args) {
        // Check if the user provided enough arguments (duration and prize)
        if (args.length < 2) {
            return message.reply('Please provide both a duration and a prize! Usage: `!giveaway <duration> <prize>`');
        }

        // Extract the first argument as the duration and the rest as the prize
        const duration = args[0];
        const prize = args.slice(1).join(' ');

        // Validate the duration format
        if (!ms(duration)) {
            return message.reply('Please provide a valid duration! Example: `10m`, `1h`, `1d`');
        }

        // Create the giveaway embed
        const giveawayEmbed = new EmbedBuilder()
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(`Prize: **${prize}**\nReact with 🎉 to enter!\nTime remaining: **${ms(ms(duration), { long: true })}**`)
            .setColor(Colors.Blue) // Using Discord.js color constant
            .setTimestamp();

        // Send the giveaway message
        const giveawayMessage = await message.channel.send({ embeds: [giveawayEmbed] });

        // React to the message with 🎉
        await giveawayMessage.react('🎉');

        // Set a timeout for the giveaway duration
        setTimeout(async () => {
            // Fetch the message again to ensure we have the latest data
            const fetchedMessage = await message.channel.messages.fetch(giveawayMessage.id);
            const users = await fetchedMessage.reactions.cache.get('🎉').users.fetch();
            users.delete(message.client.user.id); // Remove the bot from the list

            // Select a random winner
            const winner = users.size > 0 ? users.random() : null;

            const endEmbed = new EmbedBuilder()
                .setTitle('🎉 GIVEAWAY ENDED 🎉')
                .setDescription(`Prize: **${prize}**\nWinner: **${winner ? winner.tag : 'No one'}**`)
                .setColor(Colors.Red) // Using Discord.js color constant
                .setTimestamp();

            await message.channel.send({ embeds: [endEmbed] });

        }, ms(duration));

        // Confirmation message to the user
        message.reply(`Giveaway started for **${prize}**! Duration: **${ms(ms(duration), { long: true })}**.`);
    },
};
