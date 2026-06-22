const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and leave the voice channel'),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.getQueue(interaction.guild.id);

        if (!queue || !queue.playing) {
            return interaction.reply({ content: 'No music is playing!', ephemeral: true });
        }

        queue.destroy();
        return interaction.reply({ content: 'Music stopped and left the voice channel!' });
    },
};
