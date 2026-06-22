// commands/profile.js
const { CommandInteraction, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

// Function to retrieve or create user profiles (placeholder)
function getOrCreateUserProfile(userId) {
    // Implement your logic here to get or create a user profile
    return {
        currency: 100, // Example value
        level: 1,
        experience: 0,
        totalCurrencyEarned: 500,
        totalActivitiesPerformed: 10,
        walletAttempts: 3,
        shieldAttempts: 2,
        cuffkitAttempts: 1,
        pinAttempts: 0,
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aboutme')
        .setDescription('👤 View your profile or someone else\'s.')
        .addUserOption(option => 
            option.setName('member')
                .setDescription('The member whose profile you want to view')
                .setRequired(false)
        ),

    async execute(interaction) {
        const member = interaction.options.getUser('member') 
            ? await interaction.guild.members.fetch(interaction.options.getUser('member').id) 
            : interaction.member;

        const userProfile = getOrCreateUserProfile(member.id);

        const embed = new EmbedBuilder()
            .setTitle(`👤 Profile - ${member.displayName}`)
            .setThumbnail(member.user.displayAvatarURL() || '')
            .setColor('GOLD')
            .addFields([
                { name: 'Currency', value: `${userProfile.currency} 💰`, inline: true },
                { name: 'Level', value: userProfile.level.toString(), inline: true },
                { name: 'Experience', value: `${userProfile.experience} XP`, inline: true },
                { name: 'Inventory', value: getInventoryItems(member, userProfile), inline: true },
                { name: 'Total Currency Earned', value: userProfile.totalCurrencyEarned.toString(), inline: true },
                { name: 'Total Activities Performed', value: userProfile.totalActivitiesPerformed.toString(), inline: true },
                { name: 'Joined Discord', value: member.user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), inline: true },
            ]);

        await interaction.reply({ embeds: [embed] });
    },
};

// Function to get inventory items based on member's roles
function getInventoryItems(member, userProfile) {
    const inventoryItems = [];

    const roles = member.roles.cache.filter(role => 
        ![1262461198843248680, 1262461647491043471, 1262461877997535292, 1262461477948882975].includes(role.id)
    );

    if (member.roles.cache.has('1262461198843248680')) { // Wallet role
        inventoryItems.push(`Wallet - ${userProfile.walletAttempts} attempts left`);
    }

    if (member.roles.cache.has('1262461647491043471')) { // Shield role
        inventoryItems.push(`Shield - ${userProfile.shieldAttempts} attempts left`);
    }

    if (member.roles.cache.has('1262461877997535292')) { // Cuffkit role
        inventoryItems.push(`Cuff kit - ${userProfile.cuffkitAttempts} attempts left`);
    }

    if (member.roles.cache.has('1262461477948882975')) { // Pin role
        inventoryItems.push(`Pin - ${userProfile.pinAttempts} attempts left`);
    }

    return inventoryItems.join(', ') || 'No items in inventory';
}
