const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'buyhealth',
    description: '💸 Buy a health boost.',
    async execute(message, args) {
        const requiredRoleId = '1247197731475161198';

        if (!message.member.roles.cache.has(requiredRoleId)) {
            await message.reply("⛔ You don't have permission to use this command.");
            return;
        }

        const userProfile = getUserProfile(message.author.id);

        if (userProfile.currency < 10000) {
            await message.reply("⛔ You don't have enough currency to buy a health boost.");
            return;
        }

        userProfile.currency -= 10000;
        userProfile.health += 100;

        saveProfiles();

        const embed = new EmbedBuilder()
            .setTitle("💸 Health Boost Purchased")
            .setDescription("You bought a health boost and increased your health by 100!")
            .setColor("#00FF00");

        await message.reply({ embeds: [embed] });
    },
};

function getUserProfile(userId) {
    // Implement this function to get or create a user profile
    // It should return an object with properties like currency and health
}

function saveProfiles() {
    // Implement this function to save user profiles
}