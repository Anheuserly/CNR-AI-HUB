const { PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'csuspend',
  description: 'Suspend a user in CNR channels',
  async execute(message, args) {
    // Check if the user has permission to manage roles
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("You don't have permission to use this command.");
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Please mention a user to suspend.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';
    const cnrSuspendRole = message.guild.roles.cache.get('1287022807678582787');

    if (!cnrSuspendRole) {
      return message.channel.send('Suspend role not found.');
    }

    // Add the suspend role to the member
    await member.roles.add(cnrSuspendRole, reason);

    // Create and send an embed message
    const embed = new EmbedBuilder()
      .setTitle('User Suspended in CNR Channels')
      .setDescription(`${member.displayName} has been suspended in CNR channels for 1 day.`)
      .setColor(Colors.Red) // Use the predefined color constant
      .addFields([{ name: 'Reason', value: reason }]); // Use addFields for new structure

    await message.channel.send({ embeds: [embed] });

    // Automatically revoke the role after 1 day
    setTimeout(async () => {
      await member.roles.remove(cnrSuspendRole);
      await message.channel.send(`${member.displayName} has been unsuspended in CNR channels (suspension duration expired).`);
    }, 86400000); // 1 day in milliseconds
  },
};
