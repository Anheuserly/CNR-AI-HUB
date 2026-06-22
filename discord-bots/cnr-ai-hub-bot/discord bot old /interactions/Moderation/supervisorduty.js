const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('supervisorduty')
    .setDescription('Toggle supervisor duty status for the user.'),

  async execute(interaction) {
    const supervisorRoleId = '1287387202233307219'; // Supervisor on duty role ID
    const communitySupervisorRoleId = '1247226799276949536'; // Community supervisor role ID
    const supervisorRole = interaction.guild.roles.cache.get(supervisorRoleId);

    // Check if the user has the Community Supervisor role
    if (!interaction.member.roles.cache.has(communitySupervisorRoleId)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription(`${interaction.user}, you do not have permission to use this command.`)
        .setColor(0xba00ff);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('Supervisor Duty Status')
      .setColor(interaction.member.roles.cache.has(supervisorRoleId) ? 0xffffff : 0xba00ff);

    // Toggle the Supervisor on-duty role
    if (interaction.member.roles.cache.has(supervisorRoleId)) {
      await interaction.member.roles.remove(supervisorRole);
      embed.setDescription(`${interaction.user}, the Supervisor is off duty.`);
    } else {
      await interaction.member.roles.add(supervisorRole);
      embed.setDescription(`${interaction.user}, the Supervisor is on duty.`);
    }

    // Send the reply with the embed
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
