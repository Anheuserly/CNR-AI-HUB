const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('💸 Give currency to another user.')
        .addUserOption(option => 
            option.setName('recipient')
                .setDescription('The user to give currency to')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Amount of currency to give')
                .setRequired(true)),

    async execute(interaction) {
        const recipient = interaction.options.getUser('recipient'); // Get the recipient user
        const amount = interaction.options.getInteger('amount'); // Get the amount to give

        if (amount <= 0) {
            await interaction.reply("⚠️ Amount must be a positive number.");
            return;
        }

        const senderProfile = await getOrCreateUserProfile(interaction.user.id);
        const recipientProfile = await getOrCreateUserProfile(recipient.id);

        if (senderProfile.currency < amount) {
            await interaction.reply("⛔ You don't have enough currency.");
            return;
        }

        senderProfile.currency -= amount; // Deduct from sender
        recipientProfile.currency += amount; // Add to recipient

        await saveUserProfile(interaction.user.id, senderProfile);
        await saveUserProfile(recipient.id, recipientProfile);

        const embed = new EmbedBuilder()
            .setTitle("💸 Currency Given")
            .setDescription(`${interaction.user.username} gave ${amount} currency to ${recipient.username}.`)
            .setColor(0x00FF00); // Green color

        await interaction.reply({ embeds: [embed] }); // Send the response
    },
};
