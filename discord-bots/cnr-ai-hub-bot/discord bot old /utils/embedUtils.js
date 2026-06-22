const { EmbedBuilder } = require('discord.js');

module.exports = {
  createTicketEmbed(title, description, color = 'Aqua') {
    return new EmbedBuilder().setTitle(title).setDescription(description).setColor(color);
  },
};
