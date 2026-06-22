const { EmbedBuilder, Colors } = require('discord.js');
const { getOrCreateUserProfile } = require('../../utils/profileManager');

module.exports = {
    data: {
        name: 'aboutme',
        description: 'Display your profile information.',
    },

    async execute(interaction) {
        const user = interaction.member;

        let userProfile;
        try {
            userProfile = await getOrCreateUserProfile(user.id);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return interaction.reply({ content: 'There was an error retrieving your profile. Please try again later.', ephemeral: true });
        }

        const nextLevelExp = userProfile.level * 100; // Example calculation
        const progressBar = '█'.repeat(Math.floor((userProfile.experience / nextLevelExp) * 10)).padEnd(10, '░');

        const badges = userProfile.badges && userProfile.badges.length > 0 
            ? userProfile.badges.join(' ') 
            : 'No badges earned yet.';

        const profileEmbed = new EmbedBuilder()
            .setTitle(`${user.displayName}'s Profile`)
            .setColor(Colors.Gold)
            .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`Welcome to your profile! Here’s everything about you:\n`)
            .addFields(
                { name: '✨ Level', value: userProfile.level ? userProfile.level.toString() : 'N/A', inline: true },
                { name: '🌟 Experience', value: userProfile.experience ? userProfile.experience.toString() : 'N/A', inline: true },
                { name: '💰 Currency', value: userProfile.currency ? userProfile.currency.toString() : 'N/A', inline: true },
                { name: '❤️ Health', value: `${userProfile.health}/${userProfile.maxHealth}`, inline: true },
                { name: '🛡️ Armor', value: `${userProfile.armor} Armor`, inline: true },
                { name: '🏅 Badges', value: badges, inline: false },
                { 
                    name: '🧳 Inventory', 
                    value: userProfile.inventory && userProfile.inventory.length > 0 
                        ? `Items (${userProfile.inventory.length}): ${userProfile.inventory.map(item => item.name).join(', ')}` 
                        : 'No items in inventory.', 
                    inline: false 
                },
                { 
                    name: '⚔️ Weapons', 
                    value: userProfile.weapons && userProfile.weapons.length > 0 
                        ? `Weapons (${userProfile.weapons.length}): ${userProfile.weapons.join(', ')}` 
                        : 'No weapons.', 
                    inline: false 
                },
                { 
                    name: '📅 Profile Created', 
                    value: new Date(userProfile.createdAt).toLocaleString(), 
                    inline: true 
                },
                { 
                    name: '📊 Experience Progress', 
                    value: `${progressBar} (${userProfile.experience}/${nextLevelExp})`, 
                    inline: false 
                },
                { 
                    name: '🕒 Last Active', 
                    value: userProfile.lastActive 
                        ? new Date(userProfile.lastActive).toLocaleString() 
                        : 'Not recorded.', 
                    inline: true 
                }
            )
            .setFooter({ text: `Requested by ${user.user.username}`, iconURL: user.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp(); 

        await interaction.reply({ embeds: [profileEmbed] });
    },
};
