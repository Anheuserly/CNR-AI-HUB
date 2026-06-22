const { MessageEmbed } = require('discord.js');

const createNowPlayingEmbed = (track) => {
  return new MessageEmbed()
    .setTitle(`🎶 Now Playing: ${track.title}`)
    .setDescription(`By ${track.artist}`)
    .setThumbnail(track.albumArt)
    .setColor('BLUE');
};

const createQueueEmbed = (queue) => {
  const embed = new MessageEmbed().setTitle('🎶 Music Queue').setColor('PURPLE');
  queue.forEach((track, index) => {
    embed.addField(`#${index + 1}: ${track.title}`, `By: ${track.artist}`);
  });
  return embed;
};

module.exports = { createNowPlayingEmbed, createQueueEmbed };
