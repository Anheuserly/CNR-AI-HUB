import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { env } from "./env.js";

if (!env.token || !env.clientId || !env.guildId) {
  throw new Error("Missing CNR_AI_CHAT_BOT_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID.");
}

const commands = [
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask CNR AI Chat a question.")
    .addStringOption((option) => option.setName("question").setDescription("Your question.").setRequired(true).setMaxLength(1500)),
  new SlashCommandBuilder().setName("profile").setDescription("Show your stored CNR AI Chat profile."),
  new SlashCommandBuilder().setName("reset_context").setDescription("Log a context reset for your chat memory.")
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(env.token);
await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId), { body: commands });

console.log("Registered CNR AI Chat Bot slash commands.");
