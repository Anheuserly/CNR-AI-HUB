const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const ms = require('ms'); // Ensure to install this package with `npm install ms`

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cmute')
    .setDescription('Mute a user in CNR channels for a specified duration')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to mute')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('duration')
        .setDescription('Duration to mute (e.g., 10m, 1h, 2d)')
        .setRequired(true)
        .addChoices(
          { name: '10 minutes', value: '10m' },
          { name: '30 minutes', value: '30m' },
          { name: '1 hour', value: '1h' },
          { name: '6 hours', value: '6h' },
          { name: '12 hours', value: '12h' },
          { name: '1 day', value: '1d' },
          { name: '1 week', value: '7d' }
        ))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('The reason for muting')
        .setRequired(false)),

  async execute(interaction) {
    // Check if the user has permission to manage roles
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }

    const member = interaction.options.getMember('user');
    if (!member) {
      return interaction.reply({ content: 'Please specify a valid user to mute.', ephemeral: true });
    }

    // Prevent muting members with higher or equal roles
    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ content: 'You cannot mute someone with an equal or higher role than yours.', ephemeral: true });
    }

    const reason = interaction.options.getString('reason') || 'No reason provided';
    const durationArg = interaction.options.getString('duration');
    const duration = ms(durationArg);

    if (!duration || isNaN(duration)) {
      return interaction.reply({ content: 'Please provide a valid duration (e.g., 10m, 1h, 2d).', ephemeral: true });
    }

    // Find the mute role in the guild
    const cnrMuteRole = interaction.guild.roles.cache.get('1288926880195543082'); // Ensure this is a valid role ID in your server
    if (!cnrMuteRole) {
      return interaction.reply({ content: 'Mute role not found.', ephemeral: true });
    }

    // Add the mute role to the member
    try {
      await member.roles.add(cnrMuteRole, reason);
    } catch (error) {
      console.error('Failed to mute the user:', error);
      return interaction.reply({ content: 'Failed to mute the user. Please check my role permissions.', ephemeral: true });
    }

    // Create and send an embed message to confirm the mute
    const embed = new EmbedBuilder()
      .setTitle('User Muted in CNR Channels')
      .setDescription(`${member.displayName} has been muted in CNR channels.`)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Duration', value: durationArg }
      )
      .setColor('#808080')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Set a timeout to unmute the user after the duration ends
    setTimeout(async () => {
      try {
        await member.roles.remove(cnrMuteRole, 'Mute duration expired.');

        // Send a DM to the user after unmuting them
        const unmuteEmbed = new EmbedBuilder()
          .setTitle('🔊 You Have Been Unmuted 🔊')
          .setDescription(`You have been unmuted in **${interaction.guild.name}**.`)
          .setColor('#00FF00')
          .setTimestamp();

        try {
          await member.send({ embeds: [unmuteEmbed] });
        } catch (error) {
          console.error('Could not send DM to the user:', error);
        }

      } catch (error) {
        console.error('Failed to unmute the user:', error);
      }
    }, duration);
  },
};