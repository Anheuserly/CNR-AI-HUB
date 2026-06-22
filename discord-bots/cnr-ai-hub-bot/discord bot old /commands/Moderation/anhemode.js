const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'anhemode', // The command name (used as a regular message command)
  description: 'Toggle Anhemode role for yourself.',
  
  async execute(message) {
    const allowedUserId = '366767071012454405'; // Allowed user ID
    const anhemodeRoleId = '1287387552831242250'; // Anhemode role ID
    const anhemodeRole = message.guild.roles.cache.get(anhemodeRoleId);
    const member = message.member; // The user who sent the message

    // Check if the user is allowed to use this command
    if (message.author.id !== allowedUserId) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription(`${message.author}, you do not have permission to use this command.`)
        .setColor(0xff0066);
      
      return message.reply({ embeds: [embed], ephemeral: true });
    }

    // Create the embed to display the role toggle status
    const embed = new EmbedBuilder()
      .setTitle('Anhemode Role')
      .setColor(member.roles.cache.has(anhemodeRoleId) ? 0xffffff  : 0xff0066);

    if (member.roles.cache.has(anhemodeRoleId)) {
      // If the user has the role, remove it
      await member.roles.remove(anhemodeRole);
      embed.setDescription(`${message.author}, the Anhemode role has been revoked.`);
    } else {
      // If the user doesn't have the role, assign it
      await member.roles.add(anhemodeRole);
      embed.setDescription(`${message.author}, you have been assigned the Anhemode role.`);
    }

    // Send the response back to the user
    await message.reply({ embeds: [embed] });
  },
};
