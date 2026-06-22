const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Display the current music queue'),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.getQueue(interaction.guild.id);

        if (!queue || !queue.playing) {
            return interaction.reply({ content: 'No music is currently playing!', ephemeral: true });
        }

        const tracks = queue.tracks.map((track, i) => `${i + 1}. **${track.title}** - ${track.author}`).join('\n');
        const embed = new EmbedBuilder()
            .setTitle('Current Music Queue')
            .setDescription(tracks || 'No more songs in the queue!')
            .setColor('#00FF00');

        return interaction.reply({ embeds: [embed] });
    },
};
