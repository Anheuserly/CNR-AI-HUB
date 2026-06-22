const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    data: {
        name: 'ban',
        description: 'Ban a user from the server and send them a DM with the ban reason.',
        options: [
            {
                name: 'user',
                type: 6, // USER type to select a user
                description: 'User to ban',
                required: true,
            },
            {
                name: 'reason',
                type: 3, // STRING type for reason
                description: 'Reason for the ban',
                required: true,
            },
        ],
    },

    async execute(interaction) {
        // Get the user and reason from the interaction
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        // Check if the user is bannable
        if (!interaction.member.permissions.has('BAN_MEMBERS')) {
            return interaction.reply({ content: 'You do not have permission to ban members.', ephemeral: true });
        }

        if (!interaction.guild.members.cache.get(user.id)) {
            return interaction.reply({ content: 'This user is not a member of this server.', ephemeral: true });
        }

        try {
            // Ban the user
            await interaction.guild.members.ban(user, { reason });

            // Send DM to the user with the reason
            await user.send(`You have been banned from **${interaction.guild.name}** for the following reason: **${reason}**`);

            // Create a confirmation embed for the channel
            const embed = new EmbedBuilder()
                .setTitle('🔨 User Banned 🔨')
                .setDescription(`**User:** ${user.tag}\n**Reason:** ${reason}`)
                .setColor(Colors.Red) // Using Discord.js color constant
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'There was an error trying to ban this user. Please check my permissions and try again.', ephemeral: true });
        }
    },
};
