const musicManager = require('../../utils/musicManager');

module.exports = {
  name: 'pause',
  description: 'Pauses or resumes the current song',
  async execute(message) {
    if (!message.guild) return;

    const isPaused = pauseTrack(message.guild);
    if (isPaused) {
      message.channel.send('Music paused.');
    } else {
      resumeTrack(message.guild);
      message.channel.send('Music resumed.');
    }
  },
};
