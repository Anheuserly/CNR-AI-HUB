const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } = require('discord.js');
const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');

// Item data structure with role IDs
const itemData = {
    wallet: { price: 100, name: '💼 Wallet', roleId: '1262461198843248680' },
    shield: { price: 200, name: '🛡️ Shield', roleId: '1262461647491043471' },
    cuffKit: { price: 15000, name: '🔒 Cuff Kit', roleId: '1262461877997535292' },
    pin: { price: 5000, name: '📍 Pin', roleId: '1262461477948882975' },
};

// Function to deduct currency
async function deductCurrency(userId, amount) {
    const profile = await getOrCreateUserProfile(userId);
    if (profile.currency < amount) {
        throw new Error('Not enough currency.');
    }
    profile.currency -= amount; // Deduct the amount
    await saveUserProfile(userId, profile);
}

// Slash command export
module.exports = {
    data: new SlashCommandBuilder()
        .setName('itemshop')
        .setDescription('Access the item shop to purchase exclusive items!'),

    async execute(interaction) {
        const user = interaction.member;
        const userProfile = await getOrCreateUserProfile(user.id);

        const shopEmbed = new EmbedBuilder()
            .setTitle('🛒 Item Shop 🛒')
            .setDescription('Select an item to purchase:')
            .setColor(Colors.DarkRed)
            .setFooter({ text: `Requested by ${user.user.username}`, iconURL: user.user.avatarURL() });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('wallet').setLabel(`Buy Wallet for ${itemData.wallet.price}`).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('shield').setLabel(`Buy Shield for ${itemData.shield.price}`).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('cuffKit').setLabel(`Buy Cuff Kit for ${itemData.cuffKit.price}`).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('pin').setLabel(`Buy Pin for ${itemData.pin.price}`).setStyle(ButtonStyle.Primary),
            );

        await interaction.reply({ embeds: [shopEmbed], components: [row] });

        const filter = (buttonInteraction) => buttonInteraction.user.id === user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 120000 });

        collector.on('collect', async (buttonInteraction) => {
            const itemId = buttonInteraction.customId;
            const item = itemData[itemId];

            if (!item) {
                return buttonInteraction.reply({ content: 'Invalid item selected.', ephemeral: true });
            }

            // Check if user has enough currency
            if (userProfile.currency < item.price) {
                return buttonInteraction.reply({ content: 'You do not have enough currency to buy this item.', ephemeral: true });
            }

            try {
                // Deduct currency for the item
                await deductCurrency(user.id, item.price);

                // Update inventory with the item
                userProfile.inventory.push({
                    name: itemId,
                });

                await saveUserProfile(user.id, userProfile);

                // Assign the role associated with the item
                const role = interaction.guild.roles.cache.get(item.roleId);
                if (role) {
                    await user.roles.add(role);
                }

                await buttonInteraction.reply(`You have successfully purchased a **${item.name}** and received the **${role.name}** role.`);
            } catch (error) {
                await buttonInteraction.reply({ content: `Error purchasing item: ${error.message}`, ephemeral: true });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'You did not make a selection in time. Please try again.', components: [] });
            }
        });
    },
};
