const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moderatorduty')
    .setDescription('Toggle Moderator duty status for the user.'),

  async execute(interaction) {
    const moderatorRoleId = '1287016512007176332'; // Moderator on duty role ID
    const communityModeratorRoleId = '1247226799276949536'; // Community Moderator role ID

    const moderatorRole = interaction.guild.roles.cache.get(moderatorRoleId);

    // Check if the user has the Community Moderator role
    if (!interaction.member.roles.cache.has(communityModeratorRoleId)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription(`${interaction.user}, you do not have permission to use this command.`)
        .setColor(0xba00ff);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('Moderator Duty Status')
      .setColor(interaction.member.roles.cache.has(moderatorRoleId) ? 0xffffff : 0x005d00);

    // Toggle the Moderator on-duty role
    if (interaction.member.roles.cache.has(moderatorRoleId)) {
      await interaction.member.roles.remove(moderatorRole);
      embed.setDescription(`${interaction.user}, the Moderator is off duty.`);
    } else {
      await interaction.member.roles.add(moderatorRole);
      embed.setDescription(`${interaction.user}, the Moderator is on duty.`);
    }

    // Send the reply with the embed
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
