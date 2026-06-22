const { PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'cunmute',
  description: 'Unmute a user in CNR channels',
  async execute(message, args) {
    // Check if the user has permission to manage roles
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("You don't have permission to use this command.");
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Please mention a user to unmute.');
    }

    const cnrMuteRole = message.guild.roles.cache.get('1287022853887098910'); // Adjust the role ID accordingly

    if (!cnrMuteRole) {
      return message.channel.send('Mute role not found.');
    }

    // Remove the mute role from the member
    try {
      await member.roles.remove(cnrMuteRole);
    } catch (error) {
      console.error(error);
      return message.channel.send('Failed to unmute the user. Please check my permissions.');
    }

    // Create and send an embed message
    const embed = new EmbedBuilder()
      .setTitle('User Unmuted in CNR Channels')
      .setDescription(`${member.displayName} has been unmuted.`)
      .setColor(Colors.Green); // Use the predefined color constant

    await message.channel.send({ embeds: [embed] });
  },
};
