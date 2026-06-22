const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'closeticket',
    async execute(interaction) {
        const channel = interaction.channel;

        if (channel.parentId !== '1248979424070602783') { // Ticket category
            return interaction.reply('This command can only be used in ticket channels.');
        }

        const logChannel = interaction.guild.channels.cache.get('1248979912941899797'); // Ticket log channel
        const logEmbed = new EmbedBuilder()
            .setTitle('Ticket Closed')
            .setDescription(`Ticket ${channel} has been closed by ${interaction.user}.`)
            .setColor('Red');

        await logChannel.send({ embeds: [logEmbed] });
        await channel.delete('Ticket closed');

        interaction.reply('Ticket closed successfully.');
    },
};