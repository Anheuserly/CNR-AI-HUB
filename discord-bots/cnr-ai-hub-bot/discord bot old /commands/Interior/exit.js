const { EmbedBuilder } = require('discord.js');

// List of all interior roles
const interiors = [
  { name: 'Ammunation', roleID: '1247197731475161198' },
  { name: 'Bank', roleID: '1247197700051701842' },
  { name: 'hospital', roleID: '1338183807798349855' },
  { name: 'Item Shop', roleID: '1247197782146678804' },
  { name: 'Casino', roleID: '1291385955193978952' },
  { name: 'Restraunt', roleID: '1291385987091402834' },
];

module.exports = {
  name: 'exit',
  async execute(message, args) {
    // Check if the user has any interior role
    const userRoles = message.member.roles.cache;
    const interiorRole = interiors.find(interior => userRoles.has(interior.roleID));

    if (!interiorRole) {
      await message.channel.send("🚫 You are not in any interior!");
      return;
    }

    try {
      // Remove the role
      await message.member.roles.remove(interiorRole.roleID);

      const exitEmbed = new EmbedBuilder()
        .setTitle(`Exited ${interiorRole.name}`)
        .setDescription(`You have left the ${interiorRole.name}, ${message.author.username}.`)
        .setColor(0x8B0000);

      await message.channel.send({ embeds: [exitEmbed] });
      console.log(`${new Date()}: ${message.author.username} has exited the ${interiorRole.name}.`);
    } catch (error) {
      await message.channel.send("⚠️ An error occurred while trying to leave the interior.");
      console.error(`Error removing role: ${error.message}`);
    }
  },
};
