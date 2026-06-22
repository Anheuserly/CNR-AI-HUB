const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('arrest')
        .setDescription('Arrest a cuffed suspect')
        .addUserOption(option => 
            option.setName('suspect')
                .setDescription('The suspect to arrest')
                .setRequired(true)), // User input is required for the suspect
    async execute(interaction) {
        const copRoleId = '1247162188913971272';
        const suspectRoleId = '1247162056793391175';
        const cuffedRoleId = '1263908645763158157';
        const jailedRoleId = '1247170843616874518';
        const deadRoleId = '1247164748278140978';

        // Define the interior roles
        const validInteriorRoles = [
            '1248188152997478450', // Blackmarket
            '1247197731475161198', // Ammunation
            '1247197782146678804', // Itemshop
            '1247197700051701842', // Bank
        ];

        const member = interaction.member;
        const suspect = interaction.options.getMember('suspect'); // Get the selected suspect

        // Check if the user is a cop
        if (!member.roles.cache.has(copRoleId)) {
            return interaction.reply({ content: '❌ You are not assigned as a cop to arrest someone.', ephemeral: true });
        }

        // Check if the suspect is cuffed
        if (!suspect.roles.cache.has(cuffedRoleId)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Cannot arrest')
                .setDescription(`You can only arrest a cuffed suspect. ${suspect.displayName} is not cuffed.`)
                .setColor('Red');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if the suspect is already jailed or dead
        if (suspect.roles.cache.has(jailedRoleId) || suspect.roles.cache.has(deadRoleId)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Cannot arrest')
                .setDescription(`You can't arrest ${suspect.displayName} because they are already jailed or dead.`)
                .setColor('Red');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if both the cop and the suspect are in the same interior
        const copInteriorRoles = member.roles.cache.filter(role => validInteriorRoles.includes(role.id));
        const suspectInteriorRoles = suspect.roles.cache.filter(role => validInteriorRoles.includes(role.id));

        if (copInteriorRoles.size === 0 || suspectInteriorRoles.size === 0 || !copInteriorRoles.some(role => suspectInteriorRoles.has(role.id))) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Cannot arrest')
                .setDescription(`You and ${suspect.displayName} must be in the same interior to proceed with the arrest.`)
                .setColor('Red');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Perform the arrest
        await suspect.roles.remove(cuffedRoleId);
        await suspect.roles.remove(suspectRoleId);
        await suspect.roles.add(jailedRoleId);

        const arrestEmbed = new EmbedBuilder()
            .setTitle('🚔 Suspect Arrested')
            .setDescription(`${member.displayName} has arrested ${suspect.displayName}. They will be jailed for 5 minutes.`)
            .setColor('Blue');

        await interaction.reply({ embeds: [arrestEmbed] });

        // Jail timer
        for (let i = 5; i > 0; i--) {
            await new Promise(resolve => setTimeout(resolve, 60000)); // wait 1 minute
            await suspect.send(`${i} minute(s) left in jail!`);
        }

        // Release from jail
        await suspect.roles.remove(jailedRoleId);

        const releaseEmbed = new EmbedBuilder()
            .setTitle('🔓 Suspect Released')
            .setDescription(`${suspect.displayName} has been released from jail.`)
            .setColor('Green');

        await interaction.followUp({ embeds: [releaseEmbed] });
    },
};
