const fs = require('fs');
const path = require('path');
const { Events } = require('discord.js');
const setupTicket = require('../commands/Tickets/setup');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    // Corrected: Using backticks for template literals
    console.log(`Ready! Logged in as ${client.user.tag}`);

    // Set bot's custom streaming status
    client.user.setPresence({
      activities: [{
        name: '/help /gameinfo /commands', // The status message
        type: 1, // This sets the type to "STREAMING"
        url: 'https://www.twitch.tv/anheuserly', // Your Twitch URL
      }],
      status: 'online', // The purple dot (online with streaming status)
    });

    // Load the persistent ticket system
    try {
      const setupPath = path.join(__dirname, '..', 'config', 'ticketSetup.json');
      const setupData = JSON.parse(fs.readFileSync(setupPath, 'utf8'));

      const channel = client.channels.cache.get(setupData.channelId);
      if (channel) {
        channel.messages.fetch(setupData.messageId).then((message) => {
          setupTicket.createCollector(client, message);
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Failed to load ticket setup:', error);
    }
  },
};
