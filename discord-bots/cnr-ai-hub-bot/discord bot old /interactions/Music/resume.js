const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the currently paused song'),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.getQueue(interaction.guild.id);

        if (!queue || !queue.playing || !queue.paused) {
            return interaction.reply({ content: 'No paused music found!', ephemeral: true });
        }

        queue.setPaused(false);
        return interaction.reply({ content: 'Music resumed!' });
    },
};
