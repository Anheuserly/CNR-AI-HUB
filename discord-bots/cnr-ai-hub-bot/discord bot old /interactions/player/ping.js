  module.exports = {
    data: {
        name: 'ping',
        description: 'Ping command',
    },
    async execute(interaction) {
        await interaction.reply('pong!');
    },
};
