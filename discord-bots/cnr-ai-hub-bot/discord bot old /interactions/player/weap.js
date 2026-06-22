const { EmbedBuilder } = require('discord.js');
const profileManager = require('../../utils/profileManager'); // Import profile manager

// Weapon data including role IDs
const weaponData = {
    1: { name: "Glock 17", damage: 35, price: 3500, roleId: '1249709988503617586' },
    2: { name: "Desert Eagle", damage: 50, price: 5000, roleId: '1249710117633527838' },
    3: { name: "Beretta M9", damage: 20, price: 2000, roleId: '1249710185329725502' },
    12: { name: "Remington 870", damage: 70, price: 7000, roleId: '1249710331513671690' },
    13: { name: "Mossberg 500", damage: 60, price: 6000, roleId: '1249710332109262868' },
    21: { name: "Uzi", damage: 35, price: 3500, roleId: '1249710333120086168' },
    31: { name: "AK-47", damage: 60, price: 6000, roleId: '1249710334072328264' },
    32: { name: "M16", damage: 55, price: 5500, roleId: '1249710334743281795' },
    33: { name: "SCAR-H", damage: 65, price: 6500, roleId: '1249710335380946984' },
    41: { name: "Barrett M82", damage: 100, price: 10000, roleId: '1249710336710283345' },
    51: { name: "Knife", damage: 10, price: 1000, roleId: '1249710337889144842' },
    52: { name: "Baseball Bat", damage: 15, price: 1500, roleId: '1249710339097104444' },
    53: { name: "Crowbar", damage: 20, price: 2000, roleId: '1249711381758873610' },
    61: { name: "Grenade", damage: 150, price: 15000, roleId: '1249711443377651744' },
    62: { name: "Molotov Cocktail", damage: 100, price: 10000, roleId: '1249711722919366677' },
    63: { name: "C4", damage: 200, price: 20000, roleId: '1249711789713920081' },
};

module.exports = {
    data: {
        name: 'weap',
        description: '🔫 Buy a weapon using its ID',
        options: [
            {
                name: 'id',
                type: 'INTEGER', // Use INTEGER type for weapon ID
                description: 'The ID of the weapon',
                required: true,
            },
        ],
    },
    
    async execute(interaction) {
        const weaponId = interaction.options.getInteger('id'); // Get the weapon ID from options

        if (!weaponId) {
            return interaction.reply('Please provide a valid weapon ID.');
        }

        const weapon = weaponData[weaponId];

        if (!weapon) {
            return interaction.reply('⚠️ Invalid weapon ID.');
        }

        // Fetch the user's profile
        const userId = interaction.user.id;
        let profile;
        try {
            profile = await profileManager.getOrCreateUserProfile(userId);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return interaction.reply('⚠️ Error retrieving your profile. Please try again later.');
        }

        // Check if the user has enough currency
        if (profile.currency < weapon.price) {
            return interaction.reply(`⚠️ You don't have enough currency to buy the ${weapon.name}. You need $${weapon.price}, but you only have $${profile.currency}.`);
        }

        // Deduct the price from the user's currency
        profile.currency -= weapon.price;

        // Add the weapon to the user's inventory
        profile.inventory.push({ name: weapon.name, damage: weapon.damage });

        // Save the updated profile
        try {
            await profileManager.saveUserProfile(userId, profile);
        } catch (error) {
            console.error('Error saving user profile:', error);
            return interaction.reply('⚠️ Error saving your profile. Please try again later.');
        }

        // Assign the weapon role to the user
        const member = interaction.member; // Get the member who executed the command
        try {
            await member.roles.add(weapon.roleId); // Add the role corresponding to the weapon
        } catch (error) {
            console.error('Error assigning role:', error);
            return interaction.reply('⚠️ Error assigning the role. Please try again later.');
        }

        // Send a success message
        const embed = new EmbedBuilder()
            .setTitle('🔫 Weapon Purchased')
            .setDescription(`You have successfully purchased the **${weapon.name}** for $${weapon.price}. It has been added to your inventory!`)
            .setColor('#00FF00');

        await interaction.reply({ embeds: [embed] });
    },
};
