const { getOrCreateUserProfile } = require('../../utils/profileManager');

module.exports = {
    name: 'buyarmor',
    description: '💸 Buy armor to increase your health.',
    async execute(message) {
        // Check if the user has the required role
        if (!message.member.roles.cache.has('1247197731475161198')) {
            await message.reply("⛔ You don't have permission to use this command.");
            return;
        }

        const userProfile = await getOrCreateUserProfile(message.author.id);

        // Check if the user has enough currency
        if (userProfile.currency < 10000) {
            await message.reply("⛔ You don't have enough currency to buy armor.");
            return;
        }

        // Deduct the currency and increase armor
        userProfile.currency -= 10000;
        userProfile.armor += 100;
        await userProfile.save();

        // Send confirmation message
        await message.reply({
            embeds: [{
                title: "💸 Armor Purchased",
                description: "You bought armor and increased your health by 100!",
                color: 0x00FF00 // Green color
            }]
        });
    },
};
