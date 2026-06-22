const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');

module.exports = {
    name: 'earn', // Command name
    description: '💰 Earn currency by participating in activities.', // Command description
    async execute(message, args) {
        const amount = parseInt(args[0]); // Get the first argument as an integer

        if (isNaN(amount) || amount <= 0) {
            await message.reply("⚠️ Amount must be a positive integer.");
            return;
        }

        const userProfile = await getOrCreateUserProfile(message.author.id);
        userProfile.currency += amount; // Update the user's currency

        await saveUserProfile(message.author.id, userProfile); // Save the updated profile

        const embed = {
            title: "💸 Currency Earned",
            description: `You earned ${amount} currency. Total: ${userProfile.currency}`,
            color: 0x00FF00 // Green color
        };

        await message.reply({ embeds: [embed] }); // Send the response
    },
};
