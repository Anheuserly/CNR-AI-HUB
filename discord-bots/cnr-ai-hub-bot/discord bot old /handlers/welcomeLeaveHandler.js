const { EmbedBuilder, Colors } = require('discord.js');

const notificationChannelId = '1247149304745824380'; // Channel ID for notifications

module.exports = {
  handleMemberJoin: async (member) => {
    try {
      const rolesToAssign = [
        '1247163209824211045', // Civilian
        '1287026772390711326', // Duty
        '1287029732810162311', // Guns
        '1287029856143413278', // Items
        '1287026127839170590', // Userstatus
      ];

      await member.roles.add(rolesToAssign);
      console.log(`Assigned roles to ${member.user.username}`);

      const channel = member.guild.channels.cache.get(notificationChannelId);
      if (channel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Welcome!')
          .setDescription(`Welcome to the server, ${member.user.username}!`)
          .setTimestamp();

        await channel.send({ embeds: [welcomeEmbed] });
      }
    } catch (error) {
      console.error(`Failed to assign roles or send welcome message: ${error}`);
    }
  },

  handleMemberLeave: async (member) => {
    try {
      const channel = member.guild.channels.cache.get(notificationChannelId);
      if (channel) {
        const leaveEmbed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(`${member.displayName} has left the server.`)
          .setDescription(`Goodbye, ${member.displayName}! We'll miss you.`)
          .setThumbnail(member.displayAvatarURL())
          .setFooter({ text: `Member Count: ${member.guild.memberCount}` })
          .setTimestamp();

        await channel.send({ embeds: [leaveEmbed] });
      }
    } catch (error) {
      console.error(`Failed to send leave notification: ${error}`);
    }
  }
};
