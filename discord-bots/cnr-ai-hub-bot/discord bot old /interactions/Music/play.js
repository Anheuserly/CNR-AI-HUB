const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from a YouTube link or search term')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The song you want to play')
                .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel to play music!', ephemeral: true });
        }

        const player = useMainPlayer();
        const queue = player.createQueue(interaction.guild, {
            metadata: { channel: interaction.channel }
        });

        try {
            if (!queue.connection) await queue.connect(voiceChannel);
        } catch (error) {
            queue.destroy();
            return interaction.reply({ content: 'Could not join your voice channel!', ephemeral: true });
        }

        const result = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: 'youtube',
        });

        if (!result || !result.tracks.length) {
            return interaction.reply({ content: 'No results found!', ephemeral: true });
        }

        const song = result.tracks[0];
        queue.addTrack(song);

        if (!queue.playing) await queue.play();

        const embed = new EmbedBuilder()
            .setDescription(`🎶 Now playing **${song.title}**`)
            .setColor('#00ff00');

        return interaction.reply({ embeds: [embed] });
    },
};
