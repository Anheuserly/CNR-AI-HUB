const { PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  data: {
    name: 'cunban',
    description: 'Unban a user in CNR channels',
    options: [
      {
        type: 6, // USER type
        name: 'user',
        description: 'The user to unban',
        required: true,
      },
      {
        type: 3, // STRING type
        name: 'reason',
        description: 'Reason for unbanning the user',
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
    const cnrBannedRole = interaction.guild.roles.cache.get('1287022670428504165');

    if (!cnrBannedRole) {
      return interaction.reply({ content: 'Banned role not found.', ephemeral: true });
    }

    try {
      // Remove the banned role from the user
      await member.roles.remove(cnrBannedRole);

      // Send a DM to the user
      const dmEmbed = new EmbedBuilder()
        .setTitle('You Have Been Unbanned in CNR Channels')
        .setDescription(`You have been unbanned in the CNR channels.`)
        .addFields({ name: 'Reason', value: reason })
        .setColor(Colors.Green);
      
      await member.send({ embeds: [dmEmbed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'Failed to unban the user or send DM. Please check my permissions.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('User Unbanned in CNR Channels')
      .setDescription(`${member.displayName} has been unbanned.`)
      .addFields({ name: 'Reason', value: reason })
      .setColor(Colors.Green);

    await interaction.reply({ embeds: [embed] });
  },
};
