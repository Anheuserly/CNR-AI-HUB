import { REST, Routes } from "discord.js";
import { commands } from "./commands.js";
import { env } from "./env.js";

if (!env.token || !env.clientId || !env.guildId) {
  throw new Error("Missing CNR_AI_HUB_BOT_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID.");
}

type DiscordCommand = {
  id: string;
  name: string;
};

const rest = new REST({ version: "10" }).setToken(env.token);
const currentNames = new Set(commands.map((command) => command.data.name));

const [globalCommands, guildCommands] = await Promise.all([
  rest.get(Routes.applicationCommands(env.clientId)) as Promise<DiscordCommand[]>,
  rest.get(Routes.applicationGuildCommands(env.clientId, env.guildId)) as Promise<DiscordCommand[]>
]);

printCommands("Current code commands", [...currentNames].sort().map((name) => ({ id: "local", name })));
printCommands("Discord global commands", globalCommands);
printCommands("Discord guild commands", guildCommands);

const globalStale = globalCommands.filter((command) => !currentNames.has(command.name));
const guildStale = guildCommands.filter((command) => !currentNames.has(command.name));
const duplicateNames = namesWithDuplicates([...globalCommands, ...guildCommands].map((command) => command.name));

console.log(`Stale global commands: ${globalStale.map((command) => command.name).join(", ") || "none"}`);
console.log(`Stale guild commands: ${guildStale.map((command) => command.name).join(", ") || "none"}`);
console.log(`Names visible in both/global duplicate surface: ${duplicateNames.join(", ") || "none"}`);

function printCommands(title: string, list: DiscordCommand[]) {
  console.log(`\n${title} (${list.length})`);
  for (const command of list.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`- ${command.name} (${command.id})`);
  }
}

function namesWithDuplicates(names: string[]) {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name).sort();
}
