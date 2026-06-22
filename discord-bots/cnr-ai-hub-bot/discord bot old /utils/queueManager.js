let queues = new Map();

const addTrackToQueue = (trackName, message) => {
  // Fetch or create queue for the guild
  if (!queues.has(message.guild.id)) {
    queues.set(message.guild.id, []);
  }
  const queue = queues.get(message.guild.id);

  // Simulate fetching track data (title, artist, etc.)
  const track = { title: trackName, artist: 'Unknown Artist', albumArt: 'default.jpg' };

  // Add track to the queue
  queue.push(track);

  return track;
};

const getQueue = (guild) => {
  return queues.get(guild.id) || [];
};

module.exports = { addTrackToQueue, getQueue };
