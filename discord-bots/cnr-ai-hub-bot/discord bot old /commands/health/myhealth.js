const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'myhealth',
    description: '💊 Check your current health and armor.',
    async execute(message, args) {
        try {
            const userProfile = getUserProfile(message.member.id);
            const fbiRoleId = '1248949429713764353';
            const hitmanRoleId = '1248697926515953694';

            const health = 100; // Set health to 100
            let armor = userProfile.armor;

            if (message.member.roles.cache.has(fbiRoleId) || message.member.roles.cache.has(hitmanRoleId)) {
                armor = 300;
            }

            const embed = new EmbedBuilder()
                .setTitle('💊 Health and Armor')
                .setDescription(`Your current health: ${health} HP\nYour current armor: ${armor} AP`)
                .setColor('#00FF00')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in myhealth command:', error);
            await message.reply('An error occurred while checking your health and armor. Please try again later.');
        }
    },
};

function getUserProfile(userId) {
    try {
        // Attempt to read the user profile from a JSON file
        const data = fs.readFileSync('./userProfiles.json', 'utf8');
        const profiles = JSON.parse(data);

        // If the user profile exists, return it
        if (profiles[userId]) {
            return profiles[userId];
        }

        // If the user profile doesn't exist, create a new one
        const newProfile = {
            armor: 100,
            // Add other default properties as needed
        };

        // Save the new profile
        profiles[userId] = newProfile;
        fs.writeFileSync('./userProfiles.json', JSON.stringify(profiles, null, 2));

        return newProfile;
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        // If there's an error, return a default profile
        return { armor: 100 };
    }
}