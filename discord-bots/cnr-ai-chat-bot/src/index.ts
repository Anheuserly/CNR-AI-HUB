import { Client, Events, GatewayIntentBits } from "discord.js";
import { answerQuestion } from "./ai.js";
import { getDiscordUser, logBotEvent, logConversation, upsertDiscordUser } from "./appwrite.js";
import { env } from "./env.js";

if (!env.token) {
  throw new Error("Missing CNR_AI_CHAT_BOT_TOKEN. Add it to .env.local when you are ready to run the bot.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`CNR AI Chat Bot is online as ${readyClient.user.tag}`);
  await logBotEvent("bot_ready", { severity: "info", botUser: readyClient.user.tag });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const member = interaction.guild?.members.cache.get(interaction.user.id) || null;
  await upsertDiscordUser(interaction.user, interaction.guild, member);

  if (interaction.commandName === "ask") {
    await interaction.deferReply();
    const question = interaction.options.getString("question", true);
    const profile = await getDiscordUser(interaction.user.id);
    const response = await answerQuestion(question, String(profile?.memory_summary || ""));

    await logConversation({
      discordUserId: interaction.user.id,
      serverId: interaction.guildId,
      channelId: interaction.channelId,
      message: question,
      response
    });

    await interaction.editReply(response.slice(0, 1900));
  }

  if (interaction.commandName === "profile") {
    const profile = await getDiscordUser(interaction.user.id);
    await interaction.reply({
      content: profile
        ? `Stored profile for <@${interaction.user.id}>.\nUser ID: ${profile.discord_user_id}\nMemory: ${profile.memory_summary || "empty"}`
        : "No profile found yet. Use /ask once to create it.",
      ephemeral: true
    });
  }

  if (interaction.commandName === "reset_context") {
    await logBotEvent("context_reset_requested", {
      discordUserId: interaction.user.id,
      serverId: interaction.guildId,
      channelId: interaction.channelId
    });
    await interaction.reply({ content: "Context reset event logged for your Discord user ID.", ephemeral: true });
  }
});

await client.login(env.token);
