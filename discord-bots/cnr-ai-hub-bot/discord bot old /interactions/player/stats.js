const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'stats',
  description: 'Display player stats',
  async execute(message, args) {
    // Get the target user from the message, if provided
    const target = message.mentions.users.first() || message.author;
    const member = await message.guild.members.fetch(target.id);

    // Here you would fetch the actual stats from your database
    const stats = {
      balance: 1000,
      score: 500,
      robbedMoney: 200,
      returnedMoney: 100,
      // ... other stats
    };

    const embed = new EmbedBuilder()
      .setTitle('Player Stats')
      .setColor('#FFD700')
      .addFields(
        { name: 'Name', value: target.username, inline: true },
        { name: 'Account ID', value: target.id, inline: true },
        { name: 'Scores', value: stats.score.toString(), inline: true },
        { name: 'Money Robbed in Interior', value: `$${stats.robbedMoney}`, inline: true },
        { name: 'Money Returned from Dealership', value: `$${stats.returnedMoney}`, inline: true },
        // ... add other fields
      );

    await message.channel.send({ embeds: [embed] });
  },
};
