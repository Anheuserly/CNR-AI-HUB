import { Client, Databases, ID, Query } from "node-appwrite";
import type { Guild, GuildMember, User } from "discord.js";
import { env } from "./env.js";

const hasAppwrite = Boolean(env.appwriteEndpoint && env.appwriteProjectId && env.appwriteApiKey);

const client = hasAppwrite
  ? new Client().setEndpoint(env.appwriteEndpoint!).setProject(env.appwriteProjectId!).setKey(env.appwriteApiKey!)
  : null;

const databases = client ? new Databases(client) : null;

export async function upsertDiscordUser(user: User, guild?: Guild | null, member?: GuildMember | null) {
  if (!databases) return null;

  const now = new Date().toISOString();
  const data = {
    discord_user_id: user.id,
    discord_username: user.username,
    global_name: user.globalName || "",
    avatar_url: user.displayAvatarURL(),
    server_id: guild?.id || "",
    server_name: guild?.name || "",
    roles: member?.roles.cache.map((role) => role.name).slice(0, 30) || [],
    last_seen_at: now,
    updated_at: now
  };

  const existing = await databases.listDocuments(env.appwriteDatabaseId, "user_data", [
    Query.equal("discord_user_id", user.id),
    Query.limit(1)
  ]);

  if (existing.documents[0]) {
    return databases.updateDocument(env.appwriteDatabaseId, "user_data", existing.documents[0].$id, data);
  }

  return databases.createDocument(env.appwriteDatabaseId, "user_data", ID.unique(), {
    ...data,
    memory_summary: "",
    interests: [],
    warnings_count: 0,
    created_at: now
  });
}

export async function getDiscordUser(discordUserId: string) {
  if (!databases) return null;

  const existing = await databases.listDocuments(env.appwriteDatabaseId, "user_data", [
    Query.equal("discord_user_id", discordUserId),
    Query.limit(1)
  ]);

  return existing.documents[0] || null;
}

export async function logConversation(input: {
  discordUserId: string;
  serverId?: string | null;
  channelId?: string | null;
  message: string;
  response: string;
}) {
  if (!databases) return null;

  return databases.createDocument(env.appwriteDatabaseId, "bot_conversations", ID.unique(), {
    discord_user_id: input.discordUserId,
    server_id: input.serverId || "",
    channel_id: input.channelId || "",
    bot_name: "cnr-ai-chat-bot",
    message: input.message.slice(0, 3900),
    response: input.response.slice(0, 3900),
    prompt_version: "1.0.0",
    metadata_json: JSON.stringify({ source: "slash_command" }),
    created_at: new Date().toISOString()
  });
}

export async function logBotEvent(eventType: string, details: Record<string, unknown>) {
  if (!databases) return null;

  try {
    return await databases.createDocument(env.appwriteDatabaseId, "bot_events", ID.unique(), {
      event_type: eventType,
      bot_name: "cnr-ai-chat-bot",
      discord_user_id: String(details.discordUserId || ""),
      server_id: String(details.serverId || ""),
      channel_id: String(details.channelId || ""),
      severity: String(details.severity || "info"),
      details_json: JSON.stringify(details).slice(0, 7900),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.warn(`Appwrite bot event log skipped: ${error instanceof Error ? error.message : "unknown error"}`);
    return null;
  }
}
