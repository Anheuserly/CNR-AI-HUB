import { REST, Routes } from "discord.js";
import { commands } from "./commands.js";
import { env } from "./env.js";

if (!env.token || !env.clientId || !env.guildId) {
  throw new Error("Missing CNR_AI_HUB_BOT_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID.");
}

const commandPayload = commands.map((command) => command.data.toJSON());

const rest = new REST({ version: "10" }).setToken(env.token);
await rest.put(Routes.applicationCommands(env.clientId), { body: [] });
await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId), { body: commandPayload });

console.log("Cleared global CNR AI Hub Bot slash commands.");
console.log(`Registered ${commandPayload.length} current guild slash commands.`);
