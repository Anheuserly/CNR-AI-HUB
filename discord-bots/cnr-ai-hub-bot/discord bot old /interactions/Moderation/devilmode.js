const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('devilmode') // Name of the command
        .setDescription('Toggle Devilmode role for yourself.'), // Description of the command
    
    async execute(interaction) {
        const allowedUserId = '349254965413543948'; // ID of the allowed user for devilmode
        const devilmodeRoleId = '1293605248606277662'; // ID of the Devilmode role (replace with actual Devilmode role ID)
        
        // Fetch the role object from the guild
        const devilmodeRole = interaction.guild.roles.cache.get(devilmodeRoleId);
        if (!devilmodeRole) {
            console.error(`Devilmode role with ID ${devilmodeRoleId} not found.`);
            return interaction.reply({ content: 'The Devilmode role does not exist in this server.', ephemeral: true });
        }

        const member = interaction.member; // The member who triggered the command

        // Log user and role info for debugging
        console.log(`User ${interaction.user.tag} (${interaction.user.id}) is attempting to toggle the Devilmode role.`);
        
        // Check if the user is allowed to use this command
        if (interaction.user.id !== allowedUserId) {
            console.log(`User ${interaction.user.id} is not allowed to use this command.`);
            const embed = new EmbedBuilder()
                .setTitle('Permission Denied')
                .setDescription(`${interaction.user}, you do not have permission to use this command.`)
                .setColor(0xff0066);
            
            return interaction.reply({ embeds: [embed], ephemeral: true }); // Ephemeral message visible only to the user
        }

        // Create an embed to show the role toggle status
        const embed = new EmbedBuilder()
            .setTitle('Devilmode Role')
            .setColor(member.roles.cache.has(devilmodeRoleId) ? 0xffffff : 0xff0000); // Change color based on role status

        // Check if the member already has the role
        if (member.roles.cache.has(devilmodeRoleId)) {
            // If the user has the role, remove it
            await member.roles.remove(devilmodeRole);
            embed.setDescription(`${interaction.user}, the Devilmode role has been revoked.`);
            console.log(`Removed Devilmode role from ${interaction.user.tag}`);
        } else {
            // If the user doesn't have the role, assign it
            await member.roles.add(devilmodeRole);
            embed.setDescription(`${interaction.user}, you have been assigned the Devilmode role.`);
            console.log(`Assigned Devilmode role to ${interaction.user.tag}`);
        }

        // Send the response back to the user
        await interaction.reply({ embeds: [embed] });
    },
};
