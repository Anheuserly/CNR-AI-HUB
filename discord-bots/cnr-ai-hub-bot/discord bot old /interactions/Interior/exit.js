const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// List of all interior roles
const interiors = [
  { name: 'Ammunation', roleID: '1247197731475161198' },
  { name: 'Bank', roleID: '1247197700051701842' },
  
  { name: 'Item Shop', roleID: '1247197782146678804' },
  { name: 'Casino', roleID: '1291385955193978952' },
  { name: 'Restaurant', roleID: '1291385987091402834' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('exit')
    .setDescription('Exit your current interior.'),
  
  async execute(interaction) {
    // Check if the user has any interior role
    const userRoles = interaction.member.roles.cache;
    const interiorRole = interiors.find(interior => userRoles.has(interior.roleID));

    if (!interiorRole) {
      return interaction.reply("🚫 You are not in any interior!");
    }

    try {
      // Remove the role
      await interaction.member.roles.remove(interiorRole.roleID);

      const exitEmbed = new EmbedBuilder()
        .setTitle(`Exited ${interiorRole.name}`)
        .setDescription(`You have left the ${interiorRole.name}, ${interaction.user.username}.`)
        .setColor(0x8B0000);

      await interaction.reply({ embeds: [exitEmbed] });
      console.log(`${new Date()}: ${interaction.user.username} has exited the ${interiorRole.name}.`);
    } catch (error) {
      await interaction.reply("⚠️ An error occurred while trying to leave the interior.");
      console.error(`Error removing role: ${error.message}`);
    }
  },
};
