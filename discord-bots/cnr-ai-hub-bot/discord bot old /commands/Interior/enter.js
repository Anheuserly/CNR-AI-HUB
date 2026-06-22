const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const interiors = [
  { name: 'Ammunation', roleID: '1247197731475161198' },
  { name: 'Bank', roleID: '1247197700051701842' },
  { name: 'hospital', roleID: '1338183807798349855' },
  { name: 'Item Shop', roleID: '1247197782146678804' },
  { name: 'Casino', roleID: '1291385955193978952' },
  { name: 'Restraunt', roleID: '1291385987091402834' },
];

module.exports = {
  name: 'enter',
  async execute(message, args) {
    const restrictedRoleIDs = [
      '1247170843616874518', // Jailed
      '1247164748278140978'  // Dead
    ];

    const gameModeRoles = [
      '1248949429713764353', // FBI
      '1247162188913971272', // Cop
      '1248697926515953694', // Hitman
      '1248188281976389689'  // Robber
    ];

    // Check if the user has any restricted roles
    if (message.member.roles.cache.some(role => restrictedRoleIDs.includes(role.id))) {
      await message.channel.send("🚫 You cannot enter this interior while you are already in an interior.");
      return;
    }

    // Check if the user has any of the game mode roles
    if (!message.member.roles.cache.some(role => gameModeRoles.includes(role.id))) {
      await message.channel.send("🚫 You are not in game mode.");
      return;
    }

    // Create select menu
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('interior_select')
          .setPlaceholder('Select an interior to enter')
          .addOptions(
            interiors.map(interior => ({
              label: interior.name,
              value: interior.name,
              description: `Enter the ${interior.name}`,
            }))
          )
      );

    const embed = new EmbedBuilder()
      .setTitle('Interior Selection')
      .setDescription('Please select an interior to enter:')
      .setColor(0x8B0000);

    const selectMessage = await message.channel.send({
      embeds: [embed],
      components: [row]
    });

    // Create collector for the select menu
    const collector = selectMessage.createMessageComponentCollector({
      time: 30000 // 30 seconds timeout
    });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        await interaction.reply({ 
          content: "This menu is not for you!", 
          ephemeral: true 
        });
        return;
      }

      const selectedInterior = interiors.find(
        interior => interior.name === interaction.values[0]
      );

      const role = message.guild.roles.cache.get(selectedInterior.roleID);
      
      if (role) {
        try {
          await message.member.roles.add(role);
          
          const entryEmbed = new EmbedBuilder()
            .setTitle(`Entered ${selectedInterior.name}`)
            .setDescription(`You have entered the ${selectedInterior.name}, ${message.author.username}.`)
            .setColor(0x8B0000);

          await interaction.update({
            embeds: [entryEmbed],
            components: [] // Remove the select menu
          });

          console.log(`${new Date()}: ${message.author.username} has entered the ${selectedInterior.name}.`);
        } catch (error) {
          await interaction.update({
            content: `⚠️ An error occurred while trying to enter the ${selectedInterior.name}.`,
            components: []
          });
          console.error(`Error granting role: ${error.message}`);
        }
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        selectMessage.edit({
          content: 'Selection timed out.',
          components: []
        });
      }
    });
  },
};