const { PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  data: {
    name: 'cban',
    description: 'Ban a user in CNR channels',
    options: [
      {
        type: 6, // USER type
        name: 'user',
        description: 'The user to ban',
        required: true,
      },
      {
        type: 3, // STRING type
        name: 'reason',
        description: 'The reason for banning the user',
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
    const cnrBannedRole = interaction.guild.roles.cache.get('1287022670428504165');

    if (!cnrBannedRole) {
      return interaction.reply('Banned role not found.', { ephemeral: true });
    }

    const dmEmbed = new EmbedBuilder()
      .setTitle('You Have Been Banned')
      .setDescription(`You have been banned from the CNR channels.`)
      .setColor(Colors.Red)
      .addFields({ name: 'Reason', value: reason });

    try {
      // Attempt to send a DM to the user with an embed
      await member.send({ embeds: [dmEmbed] });
    } catch (error) {
      console.error('Could not send DM to the user:', error);
    }

    await member.roles.add(cnrBannedRole, reason);

    const embed = new EmbedBuilder()
      .setTitle('User Banned')
      .setDescription(`${member.displayName} has been banned.`)
      .setColor(Colors.Red)
      .addFields({ name: 'Reason', value: reason });

    await interaction.reply({ embeds: [embed] });
  },
};
