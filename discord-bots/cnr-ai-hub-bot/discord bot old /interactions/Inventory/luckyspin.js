const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('luckyspin')
        .setDescription('🎰 Try your luck and win up to 10,000 currency!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const cooldownTime = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
        const now = Date.now();
        
        // Check if user is on cooldown
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownTime;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000 / 60; // Time left in minutes
                return interaction.reply(`⏳ You need to wait ${timeLeft.toFixed(1)} more minutes before using the lucky spin again.`);
            }
        }

        // Store the timestamp when the user can use the command again
        cooldowns.set(userId, now);

        // Generate a random reward between 500 and 10,000
        const minReward = 500;
        const maxReward = 10000;
        const reward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;

        // Fetch or create user profile
        const userProfile = await getOrCreateUserProfile(userId);

        // Add the reward to user's profile
        userProfile.currency += reward;
        await saveUserProfile(userId, userProfile);

        // Visual Embed for Lucky Spin (using placeholders to simulate a wheel)
        const spinningEmbed = new EmbedBuilder()
            .setTitle("🎰 Lucky Spin")
            .setDescription("Spinning the wheel... 🎡")
            .setColor(0xFFFF00); // Yellow for attraction

        const resultEmbed = new EmbedBuilder()
            .setTitle("🎉 Lucky Spin Result")
            .setDescription(`Congratulations ${interaction.user.username}! You won **$${reward}**! Your total balance is now $${userProfile.currency}.`)
            .setColor(0x00FF00) // Green for success
            .setThumbnail('https://example.com/luckywheel.png') // Add a thumbnail or image for a more engaging result
            .setFooter({ text: "Try your luck again in 1 hour!" });

        // Simulate a delay for a more realistic spinning effect
        const messageResponse = await interaction.reply({ embeds: [spinningEmbed], ephemeral: true }); // Using ephemeral for a personal response

        setTimeout(async () => {
            await interaction.editReply({ embeds: [resultEmbed] });
        }, 3000); // 3-second delay to simulate spinning effect

        // Optionally clear the cooldown after testing
        setTimeout(() => cooldowns.delete(userId), cooldownTime);
    },
};
