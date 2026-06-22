const musicManager = require('../../utils/musicManager');

module.exports = {
  name: 'volume',
  description: 'Adjusts the volume of the music',
  async execute(message, args) {
    const volumeLevel = parseInt(args[0], 10);
    if (!volumeLevel || volumeLevel < 0 || volumeLevel > 100) {
      return message.reply('Please provide a valid volume level (0-100).');
    }

    const success = setVolume(message.guild, volumeLevel);
    if (success) {
      message.reply(`Volume set to ${volumeLevel}%`);
    } else {
      message.reply('Failed to adjust the volume.');
    }
  },
};
