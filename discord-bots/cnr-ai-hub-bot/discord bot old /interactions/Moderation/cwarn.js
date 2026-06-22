const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cwarn')
        .setDescription('Warn a user in CNR channels')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for warning the user')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        }

        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Create DM Embed for the warned user
        const dmEmbed = new EmbedBuilder()
            .setTitle('You Have Been Warned')
            .setDescription('You have received a warning in the CNR channels.')
            .setColor(Colors.Yellow)
            .addFields({ name: 'Reason', value: reason });

        try {
            // Attempt to send a DM to the user with the warning
            await member.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.error('Could not send DM to the user:', error);
        }

        // Log warning in the current channel (or change to log in a specific moderation channel)
        const logEmbed = new EmbedBuilder()
            .setTitle('User Warned in CNR Channels')
            .setDescription(`${member.displayName} has been warned.`)
            .setColor(Colors.Yellow)
            .addFields(
                { name: 'Warned User', value: member.displayName, inline: true },
                { name: 'Reason', value: reason, inline: true }
            );

        await interaction.reply({ embeds: [logEmbed] });
    },
};
