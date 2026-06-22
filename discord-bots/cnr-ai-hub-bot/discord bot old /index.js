require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const setupTicket = require('./commands/Tickets/setup');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, // Necessary for guildMemberAdd and guildMemberRemove events
        GatewayIntentBits.GuildVoiceStates,
        
    ],
});



// Define your clientId, guildId, and token from environment variables
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_BOT_TOKEN;

const rest = new REST({ version: '9' }).setToken(token);

// Command collections for both slash and prefix commands
client.slashCommands = new Collection();
client.prefixCommands = new Collection();

// Track command status
const commandStatus = {
    slash: {
        working: [],
        notWorking: [],
    },
    prefix: {
        working: [],
        notWorking: [],
    },
};

// Define the prefix for non-slash commands
const prefix = process.env.BOT_PREFIX || '!';

// Paths to interactions and commands folders
const interactionsPath = path.join(__dirname, 'interactions');
const commandsPath = path.join(__dirname, 'commands');
const eventsPath = path.join(__dirname, 'events');

// Load the ticket setup JSON
const setupFilePath = path.join(__dirname, '..', 'data', 'ticketSetup.json'); // Navigate up one level to access the data folder
let ticketSetupData;

try {
    ticketSetupData = JSON.parse(fs.readFileSync(setupFilePath, 'utf8'));
} catch (error) {
    console.error('Failed to load ticket setup data:', error);
}

// Function to log role assignments and revocations
const logRoleChange = async (member, role, action) => {
    const logChannel = client.channels.cache.get('1247994652116648018'); // Replace with your log channel ID
    if (logChannel) {
        if (action === 'add') {
            await logChannel.send(`**${member.user.tag}** has been assigned the role **${role.name}**.`);
        } else if (action === 'remove') {
            await logChannel.send(`**${member.user.tag}** has been removed from the role **${role.name}**.`);
        }
    } else {
        console.error('Log channel not found.');
    }
};

// ----- LOAD EVENTS ----- 
const loadEvents = (eventsPath) => {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`Loaded event: ${event.name}`);
    }
};

// Listen for role assignments and revocations
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Check for added roles
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    addedRoles.forEach(role => {
        logRoleChange(newMember, role, 'add');
    });

    // Check for removed roles
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
    removedRoles.forEach(role => {
        logRoleChange(newMember, role, 'remove');
    });
});

// ----- LOAD SLASH COMMANDS ----- 
const loadSlashCommands = (interactionsPath) => {
    const interactionFolders = fs.readdirSync(interactionsPath);
    for (const folder of interactionFolders) {
        const folderPath = path.join(interactionsPath, folder);
        const interactionFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of interactionFiles) {
            const filePath = path.join(folderPath, file);
            try {
                const command = require(filePath);
                if (command.data && command.execute) {
                    client.slashCommands.set(command.data.name, command);
                    commandStatus.slash.working.push(command.data.name);
                    console.log(`Loaded slash command: ${command.data.name}`);
                } else {
                    commandStatus.slash.notWorking.push(command.data ? command.data.name : filePath);
                    console.warn(`Slash command at ${filePath} is missing required fields.`);
                }
            } catch (error) {
                commandStatus.slash.notWorking.push(filePath);
                console.error(`Error loading slash command file ${filePath}:`, error);
            }
        }
    }
};

// ----- LOAD PREFIX COMMANDS ----- 
// Load prefix commands from command folders
const loadPrefixCommands = (commandsPath) => {
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);

        // Check if the path is a directory before reading files from it
        if (fs.statSync(folderPath).isDirectory()) {
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                try {
                    const command = require(filePath);
                    if (command.name && typeof command.execute === 'function') {
                        client.prefixCommands.set(command.name, command);
                        commandStatus.prefix.working.push(command.name);
                        console.log(`Loaded prefix command: ${command.name}`);
                    } else {
                        commandStatus.prefix.notWorking.push(command.name);
                        console.warn(`Command at ${filePath} is missing required fields.`);
                    }
                } catch (error) {
                    commandStatus.prefix.notWorking.push(filePath);
                    console.error(`Error loading command file ${filePath}:`, error);
                }
            }
        } else {
            console.warn(`Expected directory, but found a file: ${folderPath}`);
        }
    }
};

// ----- REGISTER SLASH COMMANDS ----- 
const registerSlashCommands = async () => {
    const commands = client.slashCommands.map(command => command.data.toJSON());
    try {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
};

// ----- SEND COMMAND STATUS TO CHANNEL ----- 
const sendCommandStatus = async (statusChannel) => {
    if (statusChannel) {
        const workingSlashCommands = commandStatus.slash.working.map(cmd => `✅ ${cmd}`).join('\n') || 'None';
        const notWorkingSlashCommands = commandStatus.slash.notWorking.map(cmd => `❌ ${cmd}`).join('\n') || 'None';
        const workingPrefixCommands = commandStatus.prefix.working.map(cmd => `✅ ${cmd}`).join('\n') || 'None';
        const notWorkingPrefixCommands = commandStatus.prefix.notWorking.map(cmd => `❌ ${cmd}`).join('\n') || 'None';

        await statusChannel.send(`**Working Slash Commands:**\n${workingSlashCommands}`);
        await statusChannel.send(`**Not Working Slash Commands:**\n${notWorkingSlashCommands}`);
        await statusChannel.send(`**Working Prefix Commands:**\n${workingPrefixCommands}`);
        await statusChannel.send(`**Not Working Prefix Commands:**\n${notWorkingPrefixCommands}`);
    }
};

// ----- INITIALIZE THE CLIENT ----- 
client.once('ready', async () => {
    console.log('Bot is online!');
    setupTicket.loadTicketSetup(client);

    await registerSlashCommands(); // Register commands
    const statusChannel = client.channels.cache.get('1247994652116648018'); // Replace with your channel ID
    await sendCommandStatus(statusChannel); // Send command status
});

// Error handling
client.on('error', error => {
    console.error(`An error occurred: ${error}`);
});

// Load events, slash commands, and prefix commands
loadEvents(eventsPath);
loadSlashCommands(interactionsPath);
loadPrefixCommands(commandsPath);

// Use the token from .env file
client.login(token);
