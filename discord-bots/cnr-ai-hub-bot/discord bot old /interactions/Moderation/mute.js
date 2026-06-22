const { EmbedBuilder, Colors } = require('discord.js');
const ms = require('ms'); // Import the ms library for duration parsing

module.exports = {
    data: {
        name: 'mute',
        description: 'Mute a user in all channels and send them a DM with the reason.',
        options: [
            {
                name: 'user',
                type: 6, // USER type to select a user
                description: 'User to mute',
                required: true,
            },
            {
                name: 'reason',
                type: 3, // STRING type for reason
                description: 'Reason for the mute',
                required: true,
            },
            {
                name: 'duration',
                type: 3, // STRING type for duration
                description: 'Duration for the mute (e.g., 10m, 1h, 1d)',
                required: false, // Make this optional
            },
        ],
    },

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getString('duration'); // Get the duration

        // Check if the user is mute-able
        if (!interaction.member.permissions.has('1247164923751043123')) {
            return interaction.reply({ content: 'You do not have permission to mute members.', ephemeral: true });
        }

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.reply({ content: 'This user is not a member of this server.', ephemeral: true });
        }

        try {
            // Get the muted role using the provided ID
            const muteRole = interaction.guild.roles.cache.get('1288926880195543082');
            if (!muteRole) {
                return interaction.reply({ content: 'Muted role not found. Please ensure the role ID is correct.', ephemeral: true });
            }

            // Mute the user
            await member.roles.add(muteRole);

            // Send DM to the user
            await user.send(`You have been muted in **${interaction.guild.name}** for the following reason: **${reason}**`);

            // Create a confirmation embed for the channel
            const embed = new EmbedBuilder()
                .setTitle('🔇 User Muted 🔇')
                .setDescription(`**User:** ${user.tag}\n**Reason:** ${reason}`)
                .setColor(Colors.Orange) // Using Discord.js color constant
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Handle duration if provided
            if (duration) {
                const muteDuration = ms(duration); // Convert the duration to milliseconds
                if (!muteDuration) {
                    return interaction.followUp({ content: 'Please provide a valid duration format (e.g., 10m, 1h, 1d).', ephemeral: true });
                }

                // Set a timeout to remove the mute role after the specified duration
                setTimeout(async () => {
                    await member.roles.remove(muteRole, 'Mute duration expired.');

                    // Inform the user they have been unmuted
                    const unmuteEmbed = new EmbedBuilder()
                        .setTitle('🔊 You Have Been Unmuted 🔊')
                        .setDescription(`You have been unmuted in **${interaction.guild.name}**.`)
                        .setColor(Colors.Green)
                        .setTimestamp();

                    try {
                        await user.send({ embeds: [unmuteEmbed] });
                    } catch (error) {
                        console.error('Could not send DM to the user:', error);
                    }
                }, muteDuration);
            }
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'There was an error trying to mute this user. Please check my permissions and try again.', ephemeral: true });
        }
    },
};
