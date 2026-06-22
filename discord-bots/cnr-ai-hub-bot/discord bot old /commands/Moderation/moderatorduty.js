const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'moderatorduty', // Command name
  description: 'Toggle Moderator duty status for the user.',
  
  async execute(message) {
    const moderatorRoleId = '1287016512007176332'; // Moderator on duty role ID
    const communityModeratorRoleId = '1247226799276949536'; // Community Moderator role ID

    const moderatorRole = message.guild.roles.cache.get(moderatorRoleId);

    // Check if the user has the Community Moderator role
    if (!message.member.roles.cache.has(communityModeratorRoleId)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription(`${message.author}, you do not have permission to use this command.`)
        .setColor(0xba00ff);
      return message.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('Moderator Duty Status')
      .setColor(message.member.roles.cache.has(moderatorRoleId) ? 0xffffff : 0x005d00);

    // Toggle the Moderator on-duty role
    if (message.member.roles.cache.has(moderatorRoleId)) {
      await message.member.roles.remove(moderatorRole);
      embed.setDescription(`${message.author}, the Moderator is off duty.`);
    } else {
      await message.member.roles.add(moderatorRole);
      embed.setDescription(`${message.author}, the Moderator is on duty.`);
    }

    // Send the reply with the embed
    await message.reply({ embeds: [embed] });
  },
};
