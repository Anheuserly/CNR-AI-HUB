import { Client, Databases, ID, Query } from "node-appwrite";
import { env } from "./env.js";

const hasAppwrite = Boolean(env.appwriteEndpoint && env.appwriteProjectId && env.appwriteApiKey);
const client = hasAppwrite
  ? new Client().setEndpoint(env.appwriteEndpoint!).setProject(env.appwriteProjectId!).setKey(env.appwriteApiKey!)
  : null;
const databases = client ? new Databases(client) : null;

export type InventoryItem = {
  name: string;
  type?: string;
  damage?: number;
  price?: number;
};

export type GameProfile = {
  $id?: string;
  discord_user_id: string;
  server_id: string;
  active_mode: string;
  current_interior: string;
  currency: number;
  marked_money: number;
  level: number;
  experience: number;
  health: number;
  max_health: number;
  armor: number;
  score: number;
  robbed_money: number;
  returned_money: number;
  total_earned: number;
  total_spent: number;
  is_dead: boolean;
  inventory_json: string;
  stats_json: string;
  last_daily_claim_at: string;
  created_at: string;
  updated_at: string;
};

export function getInventory(profile: GameProfile): InventoryItem[] {
  try {
    return JSON.parse(profile.inventory_json || "[]");
  } catch {
    return [];
  }
}

export function getStats(profile: GameProfile): Record<string, number> {
  try {
    return JSON.parse(profile.stats_json || "{}");
  } catch {
    return {};
  }
}

export function setInventory(profile: GameProfile, inventory: InventoryItem[]) {
  profile.inventory_json = JSON.stringify(inventory).slice(0, 3900);
}

export function setStats(profile: GameProfile, stats: Record<string, number>) {
  profile.stats_json = JSON.stringify(stats).slice(0, 2900);
}

export function xpForLevel(level: number) {
  return Math.max(1, level) * 100;
}

export function addExperience(profile: GameProfile, amount: number) {
  profile.experience = Math.max(0, Number(profile.experience || 0) + amount);
  while (profile.experience >= xpForLevel(profile.level)) {
    profile.experience -= xpForLevel(profile.level);
    profile.level += 1;
  }
}

export async function getOrCreateGameProfile(discordUserId: string, serverId = ""): Promise<GameProfile> {
  if (!databases) {
    return defaultProfile(discordUserId, serverId);
  }

  const existing = await databases.listDocuments(env.appwriteDatabaseId, "game_profiles", [
    Query.equal("discord_user_id", discordUserId),
    Query.equal("server_id", serverId),
    Query.limit(1)
  ]);

  if (existing.documents[0]) {
    return normalizeProfile(existing.documents[0] as unknown as Partial<GameProfile>, discordUserId, serverId);
  }

  const profile = defaultProfile(discordUserId, serverId);
  const created = await databases.createDocument(env.appwriteDatabaseId, "game_profiles", ID.unique(), profile);
  return created as unknown as GameProfile;
}

export async function saveGameProfile(profile: GameProfile): Promise<GameProfile> {
  profile.updated_at = new Date().toISOString();
  if (!databases || !profile.$id) return profile;

  const id = profile.$id;
  const data = toProfileDocument(profile);
  const saved = await databases.updateDocument(env.appwriteDatabaseId, "game_profiles", id, data);
  return normalizeProfile(saved as unknown as Partial<GameProfile>, profile.discord_user_id, profile.server_id);
}

export async function addTransaction(input: {
  discordUserId: string;
  serverId?: string | null;
  type: string;
  amount: number;
  balanceAfter: number;
  targetUserId?: string | null;
  details?: Record<string, unknown>;
}) {
  if (!databases) return null;
  return databases.createDocument(env.appwriteDatabaseId, "game_transactions", ID.unique(), {
    discord_user_id: input.discordUserId,
    server_id: input.serverId || "",
    transaction_type: input.type,
    amount: input.amount,
    balance_after: input.balanceAfter,
    target_user_id: input.targetUserId || "",
    details_json: JSON.stringify(input.details || {}).slice(0, 2400),
    created_at: new Date().toISOString()
  });
}

export async function addGameAction(input: {
  actorUserId: string;
  targetUserId?: string | null;
  serverId?: string | null;
  channelId?: string | null;
  actionType: string;
  result?: string;
  details?: Record<string, unknown>;
}) {
  if (!databases) return null;
  return databases.createDocument(env.appwriteDatabaseId, "game_actions", ID.unique(), {
    actor_user_id: input.actorUserId,
    target_user_id: input.targetUserId || "",
    server_id: input.serverId || "",
    channel_id: input.channelId || "",
    action_type: input.actionType,
    result: input.result || "ok",
    details_json: JSON.stringify(input.details || {}).slice(0, 2900),
    created_at: new Date().toISOString()
  });
}

export async function createModerationCase(input: {
  caseType: string;
  serverId?: string | null;
  moderatorUserId: string;
  targetUserId: string;
  reason?: string | null;
  status?: string;
  expiresAt?: string | null;
}) {
  if (!databases) return null;
  const now = new Date().toISOString();
  return databases.createDocument(env.appwriteDatabaseId, "moderation_cases", ID.unique(), {
    case_type: input.caseType,
    server_id: input.serverId || "",
    moderator_user_id: input.moderatorUserId,
    target_user_id: input.targetUserId,
    reason: input.reason || "",
    status: input.status || "active",
    expires_at: input.expiresAt || "",
    created_at: now,
    updated_at: now
  });
}

export async function listModerationCases(input: {
  serverId?: string | null;
  targetUserId: string;
  caseTypes?: string[];
  limit?: number;
}) {
  if (!databases) return [];
  const queries = [
    Query.equal("target_user_id", input.targetUserId),
    Query.equal("server_id", input.serverId || ""),
    Query.orderDesc("created_at"),
    Query.limit(input.limit || 10)
  ];
  if (input.caseTypes?.length) {
    queries.push(Query.equal("case_type", input.caseTypes));
  }
  const cases = await databases.listDocuments(env.appwriteDatabaseId, "moderation_cases", queries);
  return cases.documents as unknown as Array<{
    $id: string;
    case_type: string;
    server_id: string;
    moderator_user_id: string;
    target_user_id: string;
    reason: string;
    status: string;
    expires_at: string;
    created_at: string;
    updated_at: string;
  }>;
}

export async function createTicket(input: {
  ticketId: string;
  serverId?: string | null;
  channelId?: string | null;
  creatorUserId: string;
  category?: string | null;
}) {
  if (!databases) return null;
  const now = new Date().toISOString();
  return databases.createDocument(env.appwriteDatabaseId, "tickets", ID.unique(), {
    ticket_id: input.ticketId,
    server_id: input.serverId || "",
    channel_id: input.channelId || "",
    creator_user_id: input.creatorUserId,
    assigned_user_id: "",
    category: input.category || "support",
    status: "open",
    details_json: "{}",
    created_at: now,
    updated_at: now,
    closed_at: ""
  });
}

export async function updateTicket(ticketId: string, data: Record<string, unknown>) {
  if (!databases) return null;
  const existing = await databases.listDocuments(env.appwriteDatabaseId, "tickets", [
    Query.equal("ticket_id", ticketId),
    Query.limit(1)
  ]);
  const ticket = existing.documents[0];
  if (!ticket) return null;
  return databases.updateDocument(env.appwriteDatabaseId, "tickets", ticket.$id, {
    ...data,
    updated_at: new Date().toISOString()
  });
}

export async function createGiveaway(input: {
  messageId: string;
  serverId?: string | null;
  channelId?: string | null;
  hostUserId: string;
  prize: string;
  winnerCount: number;
  endsAt: string;
}) {
  if (!databases) return null;
  const now = new Date().toISOString();
  return databases.createDocument(env.appwriteDatabaseId, "giveaways", ID.unique(), {
    message_id: input.messageId,
    server_id: input.serverId || "",
    channel_id: input.channelId || "",
    host_user_id: input.hostUserId,
    prize: input.prize,
    winner_count: input.winnerCount,
    status: "active",
    ends_at: input.endsAt,
    winner_ids_json: "[]",
    created_at: now,
    updated_at: now
  });
}

export async function updateGiveaway(messageId: string, data: Record<string, unknown>) {
  if (!databases) return null;
  const existing = await databases.listDocuments(env.appwriteDatabaseId, "giveaways", [
    Query.equal("message_id", messageId),
    Query.limit(1)
  ]);
  const giveaway = existing.documents[0];
  if (!giveaway) return null;
  return databases.updateDocument(env.appwriteDatabaseId, "giveaways", giveaway.$id, {
    ...data,
    updated_at: new Date().toISOString()
  });
}

export async function listActiveGiveaways(serverId?: string | null) {
  if (!databases) return [];
  const queries = [Query.equal("status", "active"), Query.limit(100)];
  if (serverId) queries.push(Query.equal("server_id", serverId));
  const existing = await databases.listDocuments(env.appwriteDatabaseId, "giveaways", queries);
  return existing.documents as unknown as Array<{
    message_id: string;
    server_id: string;
    channel_id: string;
    host_user_id: string;
    prize: string;
    winner_count: number;
    status: string;
    ends_at: string;
    winner_ids_json: string;
  }>;
}

export async function checkCooldown(key: string, discordUserId: string, serverId: string, durationMs: number) {
  if (!databases) return { allowed: true, secondsLeft: 0 };

  const now = Date.now();
  const existing = await databases.listDocuments(env.appwriteDatabaseId, "cooldown_records", [
    Query.equal("cooldown_key", key),
    Query.equal("discord_user_id", discordUserId),
    Query.equal("server_id", serverId),
    Query.limit(1)
  ]);

  const current = existing.documents[0];
  if (current && new Date(String(current.expires_at)).getTime() > now) {
    return { allowed: false, secondsLeft: Math.ceil((new Date(String(current.expires_at)).getTime() - now) / 1000) };
  }

  const data = {
    cooldown_key: key,
    discord_user_id: discordUserId,
    server_id: serverId,
    expires_at: new Date(now + durationMs).toISOString(),
    updated_at: new Date().toISOString()
  };

  if (current) {
    await databases.updateDocument(env.appwriteDatabaseId, "cooldown_records", current.$id, data);
  } else {
    await databases.createDocument(env.appwriteDatabaseId, "cooldown_records", ID.unique(), {
      ...data,
      created_at: new Date().toISOString()
    });
  }

  return { allowed: true, secondsLeft: 0 };
}

export async function grantVirtualRole(discordUserId: string, serverId: string, roleKey: string, source = "command", expiresAt = "") {
  if (!databases) return null;
  const now = new Date().toISOString();
  const existing = await databases.listDocuments(env.appwriteDatabaseId, "virtual_roles", [
    Query.equal("discord_user_id", discordUserId),
    Query.equal("server_id", serverId),
    Query.equal("role_key", roleKey),
    Query.limit(1)
  ]);

  const data = {
    discord_user_id: discordUserId,
    server_id: serverId,
    role_key: roleKey,
    active: true,
    source,
    expires_at: expiresAt,
    updated_at: now
  };

  if (existing.documents[0]) {
    return databases.updateDocument(env.appwriteDatabaseId, "virtual_roles", existing.documents[0].$id, data);
  }

  return databases.createDocument(env.appwriteDatabaseId, "virtual_roles", ID.unique(), {
    ...data,
    created_at: now
  });
}

export async function revokeVirtualRole(discordUserId: string, serverId: string, roleKey: string) {
  if (!databases) return null;
  const existing = await databases.listDocuments(env.appwriteDatabaseId, "virtual_roles", [
    Query.equal("discord_user_id", discordUserId),
    Query.equal("server_id", serverId),
    Query.equal("role_key", roleKey),
    Query.limit(1)
  ]);
  if (!existing.documents[0]) return null;
  return databases.updateDocument(env.appwriteDatabaseId, "virtual_roles", existing.documents[0].$id, {
    active: false,
    updated_at: new Date().toISOString()
  });
}

export async function hasVirtualRole(discordUserId: string, serverId: string, roleKey: string) {
  if (!databases) return false;
  const existing = await databases.listDocuments(env.appwriteDatabaseId, "virtual_roles", [
    Query.equal("discord_user_id", discordUserId),
    Query.equal("server_id", serverId),
    Query.equal("role_key", roleKey),
    Query.equal("active", true),
    Query.limit(1)
  ]);
  const doc = existing.documents[0];
  if (!doc) return false;
  const expiresAt = String(doc.expires_at || "");
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    await revokeVirtualRole(discordUserId, serverId, roleKey);
    return false;
  }
  return true;
}

export async function listVirtualRoles(discordUserId: string, serverId: string) {
  if (!databases) return [];
  const existing = await databases.listDocuments(env.appwriteDatabaseId, "virtual_roles", [
    Query.equal("discord_user_id", discordUserId),
    Query.equal("server_id", serverId),
    Query.equal("active", true),
    Query.limit(100)
  ]);
  return existing.documents.map((doc) => String(doc.role_key));
}

export async function upsertRoleDefinition(input: {
  roleKey: string;
  displayName: string;
  roleGroup: string;
  description?: string;
  assignable?: boolean;
}) {
  if (!databases) return null;
  const now = new Date().toISOString();
  const existing = await databases.listDocuments(env.appwriteDatabaseId, "role_definitions", [
    Query.equal("role_key", input.roleKey),
    Query.limit(1)
  ]);
  const data = {
    role_key: input.roleKey,
    display_name: input.displayName,
    role_group: input.roleGroup,
    description: input.description || "",
    assignable: input.assignable ?? true,
    updated_at: now
  };
  if (existing.documents[0]) {
    return databases.updateDocument(env.appwriteDatabaseId, "role_definitions", existing.documents[0].$id, data);
  }
  return databases.createDocument(env.appwriteDatabaseId, "role_definitions", ID.unique(), {
    ...data,
    created_at: now
  });
}

function defaultProfile(discordUserId: string, serverId: string): GameProfile {
  const now = new Date().toISOString();
  return {
    discord_user_id: discordUserId,
    server_id: serverId,
    active_mode: "",
    current_interior: "",
    currency: 0,
    marked_money: 0,
    level: 1,
    experience: 0,
    health: 100,
    max_health: 100,
    armor: 0,
    score: 0,
    robbed_money: 0,
    returned_money: 0,
    total_earned: 0,
    total_spent: 0,
    is_dead: false,
    inventory_json: "[]",
    stats_json: "{}",
    last_daily_claim_at: "",
    created_at: now,
    updated_at: now
  };
}

function normalizeProfile(profile: Partial<GameProfile>, discordUserId: string, serverId: string): GameProfile {
  const fallback = defaultProfile(discordUserId, serverId);
  return {
    ...fallback,
    ...profile,
    discord_user_id: String(profile.discord_user_id || discordUserId),
    server_id: String(profile.server_id || serverId),
    active_mode: String(profile.active_mode || ""),
    current_interior: String(profile.current_interior || ""),
    currency: numberOr(profile.currency, fallback.currency),
    marked_money: numberOr(profile.marked_money, fallback.marked_money),
    level: Math.max(1, numberOr(profile.level, fallback.level)),
    experience: Math.max(0, numberOr(profile.experience, fallback.experience)),
    health: Math.max(0, numberOr(profile.health, fallback.health)),
    max_health: Math.max(1, numberOr(profile.max_health, fallback.max_health)),
    armor: Math.max(0, numberOr(profile.armor, fallback.armor)),
    score: Math.max(0, numberOr(profile.score, getStatsValue(profile, "score", fallback.score))),
    robbed_money: Math.max(0, numberOr(profile.robbed_money, getStatsValue(profile, "robbedMoney", fallback.robbed_money))),
    returned_money: Math.max(0, numberOr(profile.returned_money, getStatsValue(profile, "returnedMoney", fallback.returned_money))),
    total_earned: Math.max(0, numberOr(profile.total_earned, fallback.total_earned)),
    total_spent: Math.max(0, numberOr(profile.total_spent, fallback.total_spent)),
    is_dead: Boolean(profile.is_dead),
    inventory_json: String(profile.inventory_json || fallback.inventory_json),
    stats_json: String(profile.stats_json || fallback.stats_json),
    last_daily_claim_at: String(profile.last_daily_claim_at || ""),
    created_at: String(profile.created_at || fallback.created_at),
    updated_at: String(profile.updated_at || fallback.updated_at)
  };
}

function toProfileDocument(profile: GameProfile) {
  return {
    discord_user_id: profile.discord_user_id,
    server_id: profile.server_id,
    active_mode: profile.active_mode,
    current_interior: profile.current_interior,
    currency: profile.currency,
    marked_money: profile.marked_money,
    level: profile.level,
    experience: profile.experience,
    health: profile.health,
    max_health: profile.max_health,
    armor: profile.armor,
    score: profile.score,
    robbed_money: profile.robbed_money,
    returned_money: profile.returned_money,
    total_earned: profile.total_earned,
    total_spent: profile.total_spent,
    is_dead: profile.is_dead,
    inventory_json: profile.inventory_json,
    stats_json: profile.stats_json,
    last_daily_claim_at: profile.last_daily_claim_at,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };
}

function numberOr(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getStatsValue(profile: Partial<GameProfile>, key: string, fallback: number) {
  try {
    const stats = JSON.parse(String(profile.stats_json || "{}")) as Record<string, unknown>;
    return numberOr(stats[key], fallback);
  } catch {
    return fallback;
  }
}
