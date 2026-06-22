// commands/profile.js
const { CommandInteraction, MessageEmbed } = require('discord.js');

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
    name: 'about',
    description: '👤 View your profile or someone else\'s.',
    options: [
        {
            name: 'member',
            type: 'USER',
            description: 'The member whose profile you want to view',
            required: false,
        },
    ],
    async execute(interaction) {
        const member = interaction.options.getUser('member') 
            ? await interaction.guild.members.fetch(interaction.options.getUser('member').id) 
            : interaction.member;

        const userProfile = getOrCreateUserProfile(member.id);

        const embed = new MessageEmbed()
            .setTitle(`👤 Profile - ${member.displayName}`)
            .setThumbnail(member.user.displayAvatarURL() || '')
            .setColor('GOLD')
            .addField('Currency', `${userProfile.currency} 💰`)
            .addField('Level', userProfile.level.toString())
            .addField('Experience', `${userProfile.experience} XP`)
            .addField('Inventory', getInventoryItems(member, userProfile))
            .addField('Total Currency Earned', userProfile.totalCurrencyEarned.toString())
            .addField('Total Activities Performed', userProfile.totalActivitiesPerformed.toString())
            .addField('Joined Discord', member.user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

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

    return inventoryItems.join(', ');
}
