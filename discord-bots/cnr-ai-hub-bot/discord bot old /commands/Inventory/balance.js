const { getOrCreateUserProfile } = require('../../utils/profileManager');

module.exports = {
    name: 'balance', // Command name
    description: '💰 Check your current currency balance.', // Command description
    async execute(message) {
        // Retrieve user profile
        const userProfile = await getOrCreateUserProfile(message.author.id);

        // Create the embed message
        const embed = {
            title: "💼 Current Balance",
            description: `Your current balance: ${userProfile.currency} currency.`,
            color: 0xDAA520 // Goldenrod color
        };

        // Send the embed message as a reply
        await message.reply({ embeds: [embed] });
    },
};
