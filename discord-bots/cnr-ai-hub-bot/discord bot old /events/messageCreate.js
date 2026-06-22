module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Define the prefix, or fallback to '!'
    const prefix = process.env.BOT_PREFIX || '!';

    // Check if the message starts with the prefix
    if (message.content.startsWith(prefix)) {
      // Handle prefix-based commands
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      // Get the command from the collection
      const command = message.client.prefixCommands.get(commandName);

      // If command doesn't exist, ignore
      if (!command) return;

      // Permission check (optional)
      const { checkPermissions } = require('../utils/permissions');
      if (!checkPermissions(message, command)) return;

      // Cooldown logic
      const { applyCooldown } = require('../utils/cooldowns');
      if (applyCooldown(message, command)) return;

      // Try to execute the command
      try {
        await command.execute(message, args);
      } catch (error) {
        console.error(error);
        await message.reply('There was an error executing that command.');
      }
    }
  },
};
