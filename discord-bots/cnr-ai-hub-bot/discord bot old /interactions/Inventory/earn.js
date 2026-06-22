const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('earn')
        .setDescription('💰 Earn currency by participating in activities.')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Amount of currency to earn')
                .setRequired(true)),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount'); // Get the amount option

        if (amount <= 0) {
            await interaction.reply("⚠️ Amount must be a positive integer.");
            return;
        }

        const userProfile = await getOrCreateUserProfile(interaction.user.id);
        userProfile.currency += amount; // Update the user's currency

        await saveUserProfile(interaction.user.id, userProfile); // Save the updated profile

        const embed = new EmbedBuilder()
            .setTitle("💸 Currency Earned")
            .setDescription(`You earned ${amount} currency. Total: ${userProfile.currency}`)
            .setColor(0x00FF00); // Green color

        await interaction.reply({ embeds: [embed] }); // Send the response
    },
};
