const { PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'cunban',
  description: 'Unban a user in CNR channels',
  async execute(message, args) {
    // Check if the user has permission to manage roles
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("You don't have permission to use this command.");
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Please mention a user to unban.');
    }

    const cnrBannedRole = message.guild.roles.cache.get('1287022670428504165');

    if (!cnrBannedRole) {
      return message.channel.send('Banned role not found.');
    }

    // Remove the banned role from the member
    try {
      await member.roles.remove(cnrBannedRole);
    } catch (error) {
      console.error(error);
      return message.channel.send('Failed to unban the user. Please check my permissions.');
    }

    // Create and send an embed message
    const embed = new EmbedBuilder()
      .setTitle('User Unbanned in CNR Channels')
      .setDescription(`${member.displayName} has been unbanned.`)
      .setColor(Colors.Green); // Use the predefined color constant

    await message.channel.send({ embeds: [embed] });
  },
};
