const { PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'cunsuspend',
  description: 'Unsuspend a user in CNR channels',
  async execute(message, args) {
    // Check if the user has permission to manage roles
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("You don't have permission to use this command.");
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Please mention a user to unsuspend.');
    }

    const cnrSuspendRole = message.guild.roles.cache.get('1287022807678582787');

    if (!cnrSuspendRole) {
      return message.channel.send('Suspend role not found.');
    }

    // Remove the suspend role from the member
    await member.roles.remove(cnrSuspendRole);

    // Create and send an embed message
    const embed = new EmbedBuilder()
      .setTitle('User Unsuspended in CNR Channels')
      .setDescription(`${member.displayName} has been unsuspended in CNR channels.`)
      .setColor(Colors.Green); // Use the predefined color constant

    await message.channel.send({ embeds: [embed] });
  },
};
