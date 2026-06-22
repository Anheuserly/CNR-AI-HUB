const { PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  data: {
    name: 'cunmute',
    description: 'Unmute a user in CNR channels',
    options: [
      {
        type: 6, // USER type
        name: 'user',
        description: 'The user to unmute',
        required: true,
      },
      {
        type: 3, // STRING type
        name: 'reason',
        description: 'Reason for unmuting the user',
        required: false,
      },
    ],
  },
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }

    const member = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const cnrMuteRole = interaction.guild.roles.cache.get('1287022853887098910');

    if (!cnrMuteRole) {
      return interaction.reply({ content: 'Mute role not found.', ephemeral: true });
    }

    try {
      // Remove the mute role from the user
      await member.roles.remove(cnrMuteRole);

      // Send a DM to the user
      const dmEmbed = new EmbedBuilder()
        .setTitle('You Have Been Unmuted in CNR Channels')
        .setDescription(`You have been unmuted in the CNR channels.`)
        .addFields({ name: 'Reason', value: reason })
        .setColor(Colors.Green);
      
      await member.send({ embeds: [dmEmbed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'Failed to unmute the user or send DM. Please check my permissions.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('User Unmuted in CNR Channels')
      .setDescription(`${member.displayName} has been unmuted.`)
      .addFields({ name: 'Reason', value: reason })
      .setColor(Colors.Green);

    await interaction.reply({ embeds: [embed] });
  },
};
