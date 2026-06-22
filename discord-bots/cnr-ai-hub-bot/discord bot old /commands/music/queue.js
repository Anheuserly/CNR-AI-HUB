const { createQueueEmbed } = require('../../utils/embedCreator');
const queueManager = require('../../utils/queueManager');

module.exports = {
  name: 'queue',
  description: 'Displays the current queue',
  async execute(message) {
    const queue = getQueue(message.guild);
    if (queue.length === 0) {
      return message.channel.send('The queue is currently empty.');
    }

    const queueEmbed = createQueueEmbed(queue);
    message.channel.send({ embeds: [queueEmbed] });
  },
};
