const { getOrCreateUserProfile } = require('../../utils/profileManager');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('💰 Check your current currency balance.'),

    async execute(interaction) {
        // Retrieve user profile
        const userProfile = await getOrCreateUserProfile(interaction.user.id);

        // Create the embed message
        const embed = new EmbedBuilder()
            .setTitle("💼 Current Balance")
            .setDescription(`Your current balance: ${userProfile.currency} currency.`)
            .setColor(0xDAA520); // Goldenrod color

        // Send the embed message as a reply
        await interaction.reply({ embeds: [embed] });
    },
};
