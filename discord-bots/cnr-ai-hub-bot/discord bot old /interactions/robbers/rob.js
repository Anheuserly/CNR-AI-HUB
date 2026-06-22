const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rob')
        .setDescription('Rob a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to rob')
                .setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const targetMember = interaction.guild.members.cache.get(target.id);
        
        // Check if the target is valid
        if (!targetMember) {
            return interaction.reply('The mentioned user is not valid.');
        }

        // Add your robbery logic here
        const amount = Math.floor(Math.random() * 100) + 1; // Example amount to rob

        const embed = new EmbedBuilder()
            .setTitle('Successful Robbery')
            .setDescription(`You robbed $${amount} from ${targetMember.user.username}.`)
            .setColor(0x00FF00); // Green color

        await interaction.reply({ embeds: [embed] });
    },
};
