const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anhemode') // Name of the command
        .setDescription('Toggle Anhemode role for yourself.'), // Description of the command
    
    async execute(interaction) {
        const allowedUserId = '366767071012454405'; // ID of the allowed user
        const anhemodeRoleId = '1287387552831242250'; // ID of the Anhemode role
        
        // Fetch the role object from the guild
        const anhemodeRole = interaction.guild.roles.cache.get(anhemodeRoleId);
        if (!anhemodeRole) {
            console.error(`Anhemode role with ID ${anhemodeRoleId} not found.`);
            return interaction.reply({ content: 'The Anhemode role does not exist in this server.', ephemeral: true });
        }

        const member = interaction.member; // The member who triggered the command

        // Log user and role info for debugging
        console.log(`User ${interaction.user.tag} (${interaction.user.id}) is attempting to toggle the Anhemode role.`);
        
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
            .setTitle('Anhemode Role')
            .setColor(member.roles.cache.has(anhemodeRoleId) ? 0xffffff : 0xff0066); // Change color based on role status

        // Check if the member already has the role
        if (member.roles.cache.has(anhemodeRoleId)) {
            // If the user has the role, remove it
            await member.roles.remove(anhemodeRole);
            embed.setDescription(`${interaction.user}, the Anhemode role has been revoked.`);
            console.log(`Removed Anhemode role from ${interaction.user.tag}`);
        } else {
            // If the user doesn't have the role, assign it
            await member.roles.add(anhemodeRole);
            embed.setDescription(`${interaction.user}, you have been assigned the Anhemode role.`);
            console.log(`Assigned Anhemode role to ${interaction.user.tag}`);
        }

        // Send the response back to the user
        await interaction.reply({ embeds: [embed] });
    },
};
