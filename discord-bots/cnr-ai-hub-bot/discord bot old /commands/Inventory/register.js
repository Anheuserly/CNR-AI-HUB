const { EmbedBuilder } = require('discord.js');
const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');

module.exports = {
    name: 'register',
    description: 'Register a new user profile.',
    async execute(message, args) {
        const registeredRoleId = '1261768026559086592';
        const member = message.member;

        // Check if the user already has the registered role
        if (member.roles.cache.has(registeredRoleId)) {
            await message.reply("You are already registered.");
            return;
        }

        try {
            // Grant the registered role to the user
            const registeredRole = message.guild.roles.cache.get(registeredRoleId);
            if (registeredRole) {
                await member.roles.add(registeredRole);

                // Fetch or create the user profile
                const userProfile = await getOrCreateUserProfile(message.author.id);
                
                // Add $50,000 to their balance
                const giftAmount = 50000;
                userProfile.currency += giftAmount;
                
                // Save the updated profile
                await saveUserProfile(message.author.id, userProfile);

                // Send an embed message
                const embed = new EmbedBuilder()
                    .setTitle("📝 User Profile Created")
                    .setDescription(`You have been registered successfully, and you have received $${giftAmount} as a welcome gift! Your total balance is now $${userProfile.currency}.`)
                    .setColor('#00FF00'); // Green color

                await message.reply({ embeds: [embed] });
            } else {
                await message.reply("Error: Registered role not found. Please contact an administrator.");
            }
        } catch (error) {
            console.error('Error in register command:', error);
            await message.reply("An error occurred while trying to register. Please try again later or contact an administrator.");
        }
    },
};
