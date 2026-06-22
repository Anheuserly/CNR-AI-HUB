const { PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  data: {
    name: 'csuspend',
    description: 'Suspend a user in CNR channels',
    options: [
      {
        type: 6, // USER type
        name: 'user',
        description: 'The user to suspend',
        required: true,
      },
      {
        type: 3, // STRING type
        name: 'reason',
        description: 'The reason for suspending the user',
        required: false,
      },
    ],
  },
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply("You don't have permission to use this command.", { ephemeral: true });
    }

    const member = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const cnrSuspendRole = interaction.guild.roles.cache.get('1287022807678582787');

    if (!cnrSuspendRole) {
      return interaction.reply('Suspend role not found.', { ephemeral: true });
    }

    const dmEmbed = new EmbedBuilder()
      .setTitle('You Have Been Suspended')
      .setDescription('You have been suspended from the CNR channels for 1 day.')
      .setColor(Colors.Red)
      .addFields({ name: 'Reason', value: reason });

    try {
      // Attempt to send a DM to the user with an embed
      await member.send({ embeds: [dmEmbed] });
    } catch (error) {
      console.error('Could not send DM to the user:', error);
    }

    await member.roles.add(cnrSuspendRole, reason);

    const embed = new EmbedBuilder()
      .setTitle('User Suspended in CNR Channels')
      .setDescription(`${member.displayName} has been suspended in CNR channels for 1 day.`)
      .setColor(Colors.Red)
      .addFields({ name: 'Reason', value: reason });

    await interaction.reply({ embeds: [embed] });

    setTimeout(async () => {
      await member.roles.remove(cnrSuspendRole);
      await interaction.channel.send(`${member.displayName} has been unsuspended in CNR channels (suspension duration expired).`);
    }, 86400000); // 1 day in milliseconds
  },
};
