require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');

// Define your clientId, guildId, and token from environment variables
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_BOT_TOKEN;

const rest = new REST({ version: '9' }).setToken(token);

// Path to the interactions folder (slash commands)
const interactionsPath = path.join(__dirname, 'interactions');

// Array to hold all slash commands
const commands = [];

// Load all slash commands from the interactions folder
const loadSlashCommands = (interactionsPath) => {
    const interactionFolders = fs.readdirSync(interactionsPath);
    for (const folder of interactionFolders) {
        const folderPath = path.join(interactionsPath, folder);
        const interactionFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of interactionFiles) {
            const filePath = path.join(folderPath, file);
            try {
                const command = require(filePath);
                if (command.data && typeof command.data.toJSON === 'function' && typeof command.execute === 'function') {
                    commands.push(command.data.toJSON()); // Add command JSON to the commands array
                    console.log(`Loaded slash command: ${command.data.name}`);
                } else {
                    console.warn(`Slash command at ${filePath} is missing required fields or is improperly defined.`);
                }
            } catch (error) {
                console.error(`Error loading slash command file ${filePath}:`, error);
            }
        }
    }
};

// Load and register the commands
(async () => {
    try {
        loadSlashCommands(interactionsPath); // Load the commands

        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Register commands to the specified guild
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
})();
