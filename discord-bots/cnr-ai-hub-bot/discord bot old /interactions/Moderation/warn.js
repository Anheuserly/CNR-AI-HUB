const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    data: {
        name: 'warn',
        description: 'Warn a user for breaking server rules and send them a DM with the reason.',
        options: [
            {
                name: 'user',
                type: 6, // USER type to select a user
                description: 'User to warn',
                required: true,
            },
            {
                name: 'reason',
                type: 3, // STRING type for reason
                description: 'Reason for the warning',
                required: true,
            },
        ],
    },

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        // Check if the user is warnable
        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
            return interaction.reply({ content: 'You do not have permission to warn members.', ephemeral: true });
        }

        try {
            // Send DM to the user with the warning
            await user.send(`You have received a warning in **${interaction.guild.name}** for the following reason: **${reason}**`);

            // Create a confirmation embed for the channel
            const embed = new EmbedBuilder()
                .setTitle('⚠️ User Warned ⚠️')
                .setDescription(`**User:** ${user.tag}\n**Reason:** ${reason}`)
                .setColor(Colors.Yellow) // Using Discord.js color constant
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'There was an error trying to warn this user. Please check my permissions and try again.', ephemeral: true });
        }
    },
};
