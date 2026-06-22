const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'aprelmode', // Regular command name
  description: 'Toggle Aprelmode role for yourself.',
  
  async execute(message) {
    const allowedUserId = '1040256657600557077'; // Allowed user ID
    const apreLmodeRoleId = '1287387695185920132'; // Aprelmode role ID
    const apreLmodeRole = message.guild.roles.cache.get(apreLmodeRoleId);
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
      .setTitle('Aprelmode Role')
      .setColor(member.roles.cache.has(apreLmodeRoleId) ? 0xffffff  : 0xff0066);

    if (member.roles.cache.has(apreLmodeRoleId)) {
      // If the user has the role, remove it
      await member.roles.remove(apreLmodeRole);
      embed.setDescription(`${message.author}, the Aprelmode role has been revoked.`);
    } else {
      // If the user doesn't have the role, assign it
      await member.roles.add(apreLmodeRole);
      embed.setDescription(`${message.author}, you have been assigned the Aprelmode role.`);
    }

    // Send the response back to the user
    await message.reply({ embeds: [embed] });
  },
};
