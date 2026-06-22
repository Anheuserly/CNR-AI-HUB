const fs = require('fs');
const path = require('path');

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Map();
  }

  loadCommands() {
    const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

    for (const folder of commandFolders) {
      const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', folder)).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const command = require(path.join(__dirname, 'commands', folder, file));
        this.commands.set(command.name, command);
      }
    }
  }

  async handleCommand(message) {
    const args = message.content.split(' ');
    const commandName = args[0].slice(1).toLowerCase(); // Remove the prefix

    if (!this.commands.has(commandName)) return;

    const command = this.commands.get(commandName);
    try {
      await command.execute(message);
    } catch (error) {
      console.error(`Error executing command ${commandName}: ${error}`);
      await message.reply('There was an error executing that command.');
    }
  }
}

module.exports = CommandHandler;
