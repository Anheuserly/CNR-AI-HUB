const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  name: 'play',  // Required field for prefix commands (if you have any)
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a song from a provided URL')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('The URL of the song to play')
        .setRequired(true)),
  async execute(interaction) {
    const url = interaction.options.getString('url');
    // Logic to play the music (implement your audio playing logic here)
    await interaction.reply(`Now playing: ${url}`);
  },
};
