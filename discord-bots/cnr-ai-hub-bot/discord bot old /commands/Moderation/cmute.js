const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const ms = require('ms'); // Ensure to install this package

module.exports = {
  name: 'cmute',
  description: 'Mute a user in CNR channels for a specified duration',
  async execute(message, args) {
    // Check if the user has permission to manage roles
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("You don't have permission to use this command.");
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Please mention a user to mute.');
    }

    // Check if there are enough arguments for the reason and duration
    if (args.length < 2) {
      return message.reply('Please provide a reason and optional duration (e.g., `!cmute @User Reason 10m`).');
    }

    // Get the duration and reason from the args
    const durationArg = args[args.length - 1]; // Last arg is the duration
    const reason = args.slice(1, -1).join(' ') || 'No reason provided'; // All args except the last one

    const cnrMuteRole = message.guild.roles.cache.get('1288926880195543082');
    if (!cnrMuteRole) {
      return message.channel.send('Mute role not found.');
    }

    // Add the mute role to the member
    await member.roles.add(cnrMuteRole, reason);

    // Create and send an embed message
    const embed = new EmbedBuilder()
      .setTitle('User Muted in CNR Channels')
      .setDescription(`${member.displayName} has been muted in CNR channels.`)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Duration', value: durationArg || 'Indefinitely' }
      )
      .setColor('#808080'); // Use a hex code for gray

    await message.channel.send({ embeds: [embed] });

    // Handle the duration if provided
    const duration = ms(durationArg);
    if (duration) {
      // Set a timeout to unmute the user after the specified duration
      setTimeout(async () => {
        await member.roles.remove(cnrMuteRole, 'Mute duration expired.');
        const unmuteEmbed = new EmbedBuilder()
          .setTitle('🔊 You Have Been Unmuted 🔊')
          .setDescription(`You have been unmuted in **${message.guild.name}**.`)
          .setColor('#00FF00') // Use a hex code for green
          .setTimestamp();

        try {
          await member.send({ embeds: [unmuteEmbed] });
        } catch (error) {
          console.error('Could not send DM to the user:', error);
        }
      }, duration);
    } else {
      return message.reply('Invalid duration format. Please use a format like 10m, 1h, etc., or omit it to mute indefinitely.');
    }
  },
};
