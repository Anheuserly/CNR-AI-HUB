const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the currently playing song'),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.getQueue(interaction.guild.id);

        if (!queue || !queue.playing) {
            return interaction.reply({ content: 'No music is currently playing!', ephemeral: true });
        }

        queue.setPaused(true);
        return interaction.reply({ content: 'Music paused!' });
    },
};
