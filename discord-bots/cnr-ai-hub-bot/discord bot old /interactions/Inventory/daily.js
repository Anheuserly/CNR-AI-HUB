const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('📆 Claim your daily currency reward.'),

    async execute(interaction) {
        // Retrieve user profile
        const userProfile = await getOrCreateUserProfile(interaction.user.id);

        const now = new Date();
        if (userProfile.lastDailyClaim && new Date(userProfile.lastDailyClaim).toDateString() === now.toDateString()) {
            // User has already claimed the daily reward today
            const embed = new EmbedBuilder()
                .setTitle("🔔 Daily Reward Claimed")
                .setDescription("You have already claimed your daily reward today. Come back tomorrow.")
                .setColor(0xFFFF00); // Yellow color
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const dailyReward = 25000;
        userProfile.currency += dailyReward; // Increase user's currency
        userProfile.lastDailyClaim = now.toISOString(); // Update last claim date
        await saveUserProfile(interaction.user.id, userProfile); // Save updated profile

        // Reply with success message
        const embed = new EmbedBuilder()
            .setTitle("🎁 Daily Reward Claimed")
            .setDescription(`You claimed your daily reward of ${dailyReward} currency. Total: ${userProfile.currency}`)
            .setColor(0x00FF00); // Green color
        await interaction.reply({ embeds: [embed] });
    },
};
