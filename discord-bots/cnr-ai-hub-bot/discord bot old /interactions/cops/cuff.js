const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cuff')
        .setDescription('Cuff a suspect')
        .addUserOption(option => 
            option.setName('suspect')
                .setDescription('The suspect to cuff')
                .setRequired(true)), // The suspect option is required
    async execute(interaction) {
        const copRoleId = '1247162188913971272';
        const suspectRoleId = '1247162056793391175';
        const cuffedRoleId = '1263908645763158157';

        // Define the interior roles
        const validInteriorRoles = [
            '1248188152997478450', // Blackmarket
            '1247197731475161198', // Ammunation
            '1247197782146678804', // Itemshop
            '1247197700051701842', // Bank
        ];

        const member = interaction.member; // The cop (command issuer)
        const suspect = interaction.options.getMember('suspect'); // The selected suspect from the command

        // Check if the user is a cop
        if (!member.roles.cache.has(copRoleId)) {
            return interaction.reply({ content: '❌ You are not assigned as a cop to cuff someone. Use `/copduty` to get assigned.', ephemeral: true });
        }

        // Check if the suspect has the suspect role
        if (!suspect.roles.cache.has(suspectRoleId)) {
            const messageEmbed = new EmbedBuilder()
                .setTitle('❌ You can only cuff a suspect')
                .setDescription(`You can only cuff a suspect, not ${suspect.displayName}.`)
                .setColor('Red');
            return interaction.reply({ embeds: [messageEmbed], ephemeral: true });
        }

        // Check if both the cop and the suspect are in the same interior
        const copInteriorRoles = member.roles.cache.filter(role => validInteriorRoles.includes(role.id));
        const suspectInteriorRoles = suspect.roles.cache.filter(role => validInteriorRoles.includes(role.id));

        if (copInteriorRoles.size === 0 || suspectInteriorRoles.size === 0 || !copInteriorRoles.some(role => suspectInteriorRoles.has(role.id))) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Cannot cuff')
                .setDescription(`You and ${suspect.displayName} must be in the same interior to cuff them.`)
                .setColor('Red');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Remove suspect role and add cuffed role
        await suspect.roles.remove(suspectRoleId);
        await suspect.roles.add(cuffedRoleId);

        const cuffEmbed = new EmbedBuilder()
            .setTitle('🔒 You Cuffed a Suspect')
            .setDescription(`You have cuffed ${suspect.displayName}.`)
            .setColor('DarkRed');

        await interaction.reply({ embeds: [cuffEmbed] });
    },
};
