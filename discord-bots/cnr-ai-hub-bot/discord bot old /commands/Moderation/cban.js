const { PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'cban',
  description: 'Ban a user in CNR channels',
  usage: '<@user> [reason]', // Optional: specify how to use the command
  category: 'Moderation', // Optional: categorize your command
  cooldown: 5, // Optional: specify a cooldown period in seconds
  async execute(message, args) {
    // Check if the user has permission to manage roles
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("You don't have permission to use this command.");
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Please mention a user to ban.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';
    const cnrBannedRole = message.guild.roles.cache.get('1287022670428504165');

    if (!cnrBannedRole) {
      return message.channel.send('Banned role not found.');
    }

    // Add the banned role to the member
    await member.roles.add(cnrBannedRole, reason);

    // Create and send an embed message
    const embed = new EmbedBuilder()
      .setTitle('User Banned')
      .setDescription(`${member.displayName} has been banned.`)
      .setColor(Colors.Red) // Use predefined color constant
      .addFields({ name: 'Reason', value: reason });

    await message.channel.send({ embeds: [embed] });
  },
};
