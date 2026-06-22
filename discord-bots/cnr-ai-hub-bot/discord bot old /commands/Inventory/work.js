const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');

// Object to store user cooldowns
const cooldowns = new Map();

module.exports = {
    name: 'work',
    description: '🛠️ Work to earn currency. (Cooldown: 2 minutes)',
    async execute(message) {
        const cooldownTime = 2 * 60 * 1000; // 2 minutes in milliseconds
        const userId = message.author.id;

        // Check if the user is on cooldown
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownTime;
            const currentTime = Date.now();

            if (currentTime < expirationTime) {
                const timeLeft = Math.round((expirationTime - currentTime) / 1000);
                return message.reply(`You need to wait ${timeLeft} seconds before working again.`);
            }
        }

        // User can work, set cooldown
        cooldowns.set(userId, Date.now());

        // Fetch or create user profile
        const userProfile = await getOrCreateUserProfile(userId);

        // Define new earning range: 1000 to 2000
        const minAmount = 1000;
        const maxAmount = 2000;
        const amountEarned = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

        // Add currency to user's profile
        userProfile.currency += amountEarned;
        await saveUserProfile(userId, userProfile);

        // Send result to the user
        await message.reply({
            embeds: [{
                title: "🏋️‍♂️ Work Result",
                description: `You worked hard and earned ${amountEarned} currency. Total: ${userProfile.currency}`,
                color: 0x0000FF // Blue color
            }]
        });
    },
};
