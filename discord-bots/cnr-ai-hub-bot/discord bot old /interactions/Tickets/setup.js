const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsetup')
        .setDescription('Sets up the ticket system for CNR - Discord AI Hub'),
    
    async execute(interaction) {
        // Create the embed message
        const embed = new EmbedBuilder()
            .setTitle('🎟️ Ticket System Setup for CNR - Discord AI Hub')
            .setDescription('Welcome! To apply for a role or report an issue, please react below:')
            .setColor('Aqua')
            .addFields(
                { name: '👉 Apply for Hitman', value: 'React with ✅ to apply for the HITMAN role.' },
                { name: '👉 Apply for FBI', value: 'React with 🔫 to apply for the FBI role.' },
                { name: '👉 Apply for Moderator', value: 'React with 👮 to apply for the MODERATOR role.' },
                { name: '👉 Report a Bug', value: 'React with 🐞 to report a bug.' },
                { name: '👉 Report a User', value: 'React with ⚠️ to report a user.' },
                { name: '👉 Suggestion Ticket', value: 'React with 💡 to submit a suggestion.' },
                { name: '👉 Other Inquiries', value: 'React with ❓ for any other inquiries.' }
            )
            .setFooter({ text: 'CNR - Discord AI Hub | React to Create a Ticket' });

        // Send the embed message
        const messageEmbed = await interaction.reply({ embeds: [embed], fetchReply: true });

        // Define the reactions to be added
        const reactions = ['✅', '🔫', '👮', '🐞', '⚠️', '💡', '❓'];

        // Add reactions to the message
        for (const reaction of reactions) {
            await messageEmbed.react(reaction);
        }
    },
};
