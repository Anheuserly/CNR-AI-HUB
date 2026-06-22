const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');

module.exports = {
    name: 'daily', // Command name
    description: '📆 Claim your daily currency reward.', // Command description
    async execute(message) {
        // Retrieve user profile
        const userProfile = await getOrCreateUserProfile(message.author.id);

        const now = new Date();
        if (userProfile.lastDailyClaim && new Date(userProfile.lastDailyClaim).toDateString() === now.toDateString()) {
            // User has already claimed the daily reward today
            const embed = {
                title: "🔔 Daily Reward Claimed",
                description: "You have already claimed your daily reward today. Come back tomorrow.",
                color: 0xFFFF00 // Yellow color
            };
            await message.reply({ embeds: [embed] });
            return;
        }

        const dailyReward = 25000;
        userProfile.currency += dailyReward; // Increase user's currency
        userProfile.lastDailyClaim = now.toISOString(); // Update last claim date
        await saveUserProfile(message.author.id, userProfile); // Save updated profile

        // Reply with success message
        const embed = {
            title: "🎁 Daily Reward Claimed",
            description: `You claimed your daily reward of ${dailyReward} currency. Total: ${userProfile.currency}`,
            color: 0x00FF00 // Green color
        };
        await message.reply({ embeds: [embed] });
    },
};
