const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops the current song and clears the queue'),
  async execute(interaction) {
    // Logic to stop the music playback
    await interaction.reply('Music playback stopped.');
  },
};
