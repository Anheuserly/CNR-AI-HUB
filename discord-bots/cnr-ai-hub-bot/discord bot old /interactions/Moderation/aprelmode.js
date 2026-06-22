const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aprelmode')
        .setDescription('Toggle Aprelmode role for yourself.'),

    async execute(interaction) {
        const allowedUserId = '1040256657600557077'; // Allowed user ID
        const apreLmodeRoleId = '1287387695185920132'; // Aprelmode role ID
        const apreLmodeRole = interaction.guild.roles.cache.get(apreLmodeRoleId);
        const member = interaction.member; // The user who invoked the command

        // Ensure the role exists in the guild
        if (!apreLmodeRole) {
            console.error(`Role with ID ${apreLmodeRoleId} not found.`);
            return interaction.reply({ content: 'The Aprelmode role does not exist in this server.', ephemeral: true });
        }

        // Check if the user is allowed to use this command
        if (interaction.user.id !== allowedUserId) {
            const embed = new EmbedBuilder()
                .setTitle('Permission Denied')
                .setDescription(`${interaction.user}, you do not have permission to use this command.`)
                .setColor(0xff0066);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Create the embed to display the role toggle status
        const embed = new EmbedBuilder()
            .setTitle('Aprelmode Role')
            .setColor(member.roles.cache.has(apreLmodeRoleId) ? 0xffffff : 0xff0066);

        // Toggle the role: Remove if the user has it, otherwise assign it
        if (member.roles.cache.has(apreLmodeRoleId)) {
            await member.roles.remove(apreLmodeRole);
            embed.setDescription(`${interaction.user}, the Aprelmode role has been revoked.`);
        } else {
            await member.roles.add(apreLmodeRole);
            embed.setDescription(`${interaction.user}, you have been assigned the Aprelmode role.`);
        }

        // Send the response back to the user
        await interaction.reply({ embeds: [embed] });
    },
};
