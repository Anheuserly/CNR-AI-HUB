import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { env } from "./env.js";
import { logBotEvent, upsertDiscordUser } from "./appwrite.js";
import { ensureTicketPanel, executeCommand, handleCnrModal, handleInteriorButton, processActiveGiveaways, syncMemberHealthCap } from "./commands.js";
import { registerAuditLogger } from "./audit-logger.js";
import { authChannelId, enforceGameAccess, handleAuthButton, removeOnlineRoleForInvisible, sendAuthPanel } from "./auth-panel.js";
import { onlinePlayerRolesChanged, updateOnlinePlayersPanel } from "./online-players-panel.js";
import { sendLeaveMessage, sendWelcomeMessage } from "./welcome-messages.js";
import { handleHuggingFaceAiMessage } from "./huggingface-ai.js";

if (!env.token) {
  throw new Error("Missing CNR_AI_HUB_BOT_TOKEN. Add it to .env.local when you are ready to run the bot.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User]
});

registerAuditLogger(client);

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`CNR AI Hub Bot is online as ${readyClient.user.tag}`);
  await ensureAccessPanel(readyClient).catch((error) => {
    console.error("CNR access panel setup failed:", error);
  });
  await updateOnlinePlayersPanel(await channelGuild(readyClient, authChannelId)).catch((error) => {
    console.error("Online players panel setup failed:", error);
  });
  await ensureTicketPanel(readyClient).catch((error) => {
    console.error("Support ticket panel setup failed:", error);
  });
  await processActiveGiveaways(readyClient).catch((error) => {
    console.error("Giveaway scheduler setup failed:", error);
  });
  setInterval(
    () => {
      void ensureAccessPanel(readyClient).catch((error) => {
        console.error("CNR access panel check failed:", error);
      });
      void channelGuild(readyClient, authChannelId)
        .then((guild) => updateOnlinePlayersPanel(guild))
        .catch((error) => {
          console.error("Online players panel refresh failed:", error);
        });
      void ensureTicketPanel(readyClient).catch((error) => {
        console.error("Support ticket panel check failed:", error);
      });
      void processActiveGiveaways(readyClient).catch((error) => {
        console.error("Giveaway scheduler refresh failed:", error);
      });
    },
    60 * 1000
  );
  await logBotEvent("bot_ready", { severity: "info", botUser: readyClient.user.tag });
});

client.on(Events.GuildMemberAdd, async (member) => {
  await upsertDiscordUser(member.user, member.guild, member);
  await sendWelcomeMessage(member);
  await updateOnlinePlayersPanel(member.guild);
  await logBotEvent("member_joined", {
    discordUserId: member.user.id,
    serverId: member.guild.id,
    username: member.user.username
  });
});

client.on(Events.GuildMemberRemove, async (member) => {
  await sendLeaveMessage(member);
  await updateOnlinePlayersPanel(member.guild);
  await logBotEvent("member_left", {
    discordUserId: member.user.id,
    serverId: member.guild.id,
    username: member.user.username
  });
});

client.on(Events.MessageCreate, async (message) => {
  await handleHuggingFaceAiMessage(message);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton()) {
      if (await handleAuthButton(interaction)) return;
      if (await handleInteriorButton(interaction)) return;
    }
    if (interaction.isModalSubmit()) {
      if (await handleCnrModal(interaction)) return;
    }

    if (!interaction.isChatInputCommand()) return;
    if (!(await enforceGameAccess(interaction))) return;

    await executeCommand(interaction);
  } catch (error) {
    console.error(`Interaction failed: ${interaction.isChatInputCommand() ? interaction.commandName : interaction.id}`, error);
    await logBotEvent("command_error", {
      severity: "error",
      discordUserId: interaction.user.id,
      serverId: interaction.guildId,
      channelId: interaction.channelId,
      command: interaction.isChatInputCommand() ? interaction.commandName : interaction.isButton() ? interaction.customId : "unknown",
      error: error instanceof Error ? error.message : "unknown error"
    });
    const message = "That command failed. I logged it so it can be fixed.";
    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: message, ephemeral: true }).catch(() => null);
      } else {
        await interaction.reply({ content: message, ephemeral: true }).catch(() => null);
      }
    }
  }
});

client.on(Events.PresenceUpdate, async (_oldPresence, newPresence) => {
  const member = newPresence.member;
  if (!member) return;
  await removeOnlineRoleForInvisible(member, newPresence.status);
  await updateOnlinePlayersPanel(member.guild);
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (onlinePlayerRolesChanged(oldMember, newMember)) {
    await updateOnlinePlayersPanel(newMember.guild);
  }
  await syncMemberHealthCap(newMember).catch((error) => {
    console.error("Health cap sync failed:", error);
  });
});

await client.login(env.token);

async function ensureAccessPanel(readyClient: Client<true>) {
  const channel = await readyClient.channels.fetch(authChannelId);
  if (!channel || !("guild" in channel)) {
    throw new Error(`CNR access channel ${authChannelId} was not found.`);
  }
  await sendAuthPanel(channel.guild, authChannelId);
}

async function channelGuild(readyClient: Client<true>, channelId: string) {
  const channel = await readyClient.channels.fetch(channelId);
  if (!channel || !("guild" in channel)) {
    throw new Error(`Channel ${channelId} was not found.`);
  }
  return channel.guild;
}
