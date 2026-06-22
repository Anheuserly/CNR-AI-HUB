const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'supervisorduty', // Command name
  description: 'Toggle supervisor duty status for the user.',
  
  async execute(message) {
    const supervisorRoleId = '1287387202233307219'; // Supervisor on duty role ID
    const communitySupervisorRoleId = '1247226799276949536'; // Community supervisor role ID
    const supervisorRole = message.guild.roles.cache.get(supervisorRoleId);

    // Check if the user has the Community Supervisor role
    if (!message.member.roles.cache.has(communitySupervisorRoleId)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription(`${message.author}, you do not have permission to use this command.`)
        .setColor(0xba00ff);
      return message.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('Supervisor Duty Status')
      .setColor(message.member.roles.cache.has(supervisorRoleId) ? 0xffffff  : 0xba00ff);

    // Toggle the Supervisor on-duty role
    if (message.member.roles.cache.has(supervisorRoleId)) {
      await message.member.roles.remove(supervisorRole);
      embed.setDescription(`${message.author}, the Supervisor is off duty.`);
    } else {
      await message.member.roles.add(supervisorRole);
      embed.setDescription(`${message.author}, the Supervisor is on duty.`);
    }

    // Send the reply with the embed
    await message.reply({ embeds: [embed] });
  },
};
