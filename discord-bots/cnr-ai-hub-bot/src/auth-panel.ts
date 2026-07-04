import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
  MessageFlags,
  PresenceStatusData
} from "discord.js";
import { upsertDiscordUser } from "./appwrite.js";
import { gameModes, interiors, roleKeys, shopItems, weapons } from "./game-config.js";
import { getInventory, getOrCreateGameProfile, getStats, grantVirtualRole, hasVirtualRole, revokeVirtualRole, saveGameProfile, setInventory, setStats } from "./game-store.js";

export const authChannelId = "1514206378900590693";
export const cnrGameChannelId = "1514296306791612478";

export const discordRoleNames = {
  registered: "Registered",
  online: "Online Players",
  cop: "Cop",
  robber: "Robber",
  fbi: "FBI",
  hitman: "Hitman",
  hitmanRegistered: "Hitman-Registered",
  fbiRegistered: "FBI-Registered"
} as const;

export const discordRoleIds = {
  registered: "1514206029490028575",
  online: "1514288528391934033",
  outside: "1516528404013514983",
  gameVip: "1514393670705479730",
  cnrMuted: "1514206082971598929"
} as const;

const gameCommandNames = new Set([
  "balance",
  "daily",
  "work",
  "give",
  "itemshop",
  "luckyspin",
  "clearinventory",
  "aboutme",
  "quit",
  "gameinfo",
  "stats",
  "interiors",
  "enter",
  "exit",
  "cuff",
  "arrest",
  "jail",
  "taze",
  "panic",
  "rob",
  "robstore",
  "bc",
  "breakcuffs",
  "picklockcuffs",
  "shot",
  "respawn",
  "myhealth",
  "buyarmor",
  "buyhealth"
]);

const gameStatusRoleIds = {
  suspect: "1514206047412162560",
  mostWanted: "1514295364994207826",
  jailed: "1514206051610919003",
  dead: "1514206063354970142",
  cuffed: "1514206049656111199"
} as const;

const classRoleKeys = ["cop", "robber", "fbi", "hitman"] as const;

export async function sendAuthPanel(guild: Guild, channelId = authChannelId) {
  await ensureAuthRoles(guild);
  const channel = await guild.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error(`Auth panel channel ${channelId} was not found or is not a text channel.`);
  }

  const messages = await channel.messages.fetch({ limit: 50 });
  const panelMessages = messages.filter((message) => message.author.id === guild.client.user.id && message.embeds[0]?.title === "CNR Game Login");
  const newestMessage = messages.first();
  const newestPanel = panelMessages.first();

  if (newestPanel && newestMessage?.id === newestPanel.id && panelMessages.size === 1) {
    await newestPanel.edit({ embeds: [authPanelEmbed()], components: authPanelRows() });
    console.log(`Updated CNR auth panel in #${channel.name} (${channel.id})`);
    return;
  }

  for (const panel of panelMessages.values()) {
    await panel.delete().catch(() => null);
  }
  await channel.send({ embeds: [authPanelEmbed()], components: authPanelRows() });
  console.log(`Posted CNR auth panel in #${channel.name} (${channel.id})`);
}

export async function repostAuthPanel(guild: Guild, channelId = authChannelId) {
  await ensureAuthRoles(guild);
  const channel = await guild.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const messages = await channel.messages.fetch({ limit: 50 });
  const existingPanels = messages.filter((message) => message.author.id === guild.client.user.id && message.embeds[0]?.title === "CNR Game Login");
  for (const panel of existingPanels.values()) {
    await panel.delete().catch(() => null);
  }
  await channel.send({ embeds: [authPanelEmbed()], components: authPanelRows() });
}

export async function ensureAuthRoles(guild: Guild) {
  await guild.roles.fetch();

  const roles = new Map<string, string>();
  const requiredRoles = [
    { name: discordRoleNames.registered, id: discordRoleIds.registered },
    { name: discordRoleNames.online, id: discordRoleIds.online }
  ];

  for (const role of requiredRoles) {
    const existing = guild.roles.cache.get(role.id) || guild.roles.cache.find((cachedRole) => cachedRole.name.toLowerCase() === role.name.toLowerCase());
    if (!existing) {
      console.warn(`Expected role ID missing: ${role.name} (${role.id})`);
      continue;
    }
    roles.set(role.name, existing.id);
  }

  for (const name of [
    discordRoleNames.cop,
    discordRoleNames.robber,
    discordRoleNames.fbi,
    discordRoleNames.hitman,
    discordRoleNames.hitmanRegistered,
    discordRoleNames.fbiRegistered
  ]) {
    const existing = guild.roles.cache.find((role) => role.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      roles.set(name, existing.id);
      continue;
    }

    console.warn(`Expected role missing: ${name}`);
  }
  return roles;
}

export async function handleAuthButton(interaction: ButtonInteraction) {
  if (!isAuthButton(interaction.customId)) return false;

  if (!interaction.guild) {
    await interaction.reply({ content: "This CNR panel only works inside the server.", ephemeral: true });
    return true;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    await interaction.guild.roles.fetch();
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (interaction.customId === "cnr_auth_register") {
      await registerPlayer(interaction, member);
      await repostPanelAfterClick(interaction);
      return true;
    }

    if (interaction.customId === "cnr_auth_login") {
      await loginPlayer(interaction, member);
      await repostPanelAfterClick(interaction);
      return true;
    }

    if (interaction.customId === "cnr_auth_quit") {
      await quitPlayer(interaction, member);
      await repostPanelAfterClick(interaction);
      return true;
    }

    if (interaction.customId.startsWith("cnr_class_")) {
      await chooseClass(interaction, member, interaction.customId.replace("cnr_class_", ""));
      await repostPanelAfterClick(interaction);
      return true;
    }
  } catch (error) {
    console.error(`CNR auth button failed: ${interaction.customId}`, error);
    await interaction.editReply({
      content: `CNR access action failed: ${error instanceof Error ? error.message : "unknown error"}.`
    });
    await repostPanelAfterClick(interaction);
    return true;
  }

  await interaction.editReply({ content: "Unknown CNR access action." });
  return true;
}

export async function enforceGameAccess(interaction: ChatInputCommandInteraction) {
  if (!gameCommandNames.has(interaction.commandName)) return true;
  if (!interaction.guild || !(interaction.member instanceof GuildMember)) return true;

  const member = interaction.member;
  if (interaction.channelId !== cnrGameChannelId) {
    await interaction.reply({
      content: `CNR game commands can only be used in <#${cnrGameChannelId}>.`,
      ephemeral: true
    });
    return false;
  }

  if (!hasDiscordRole(member, "online")) {
    await interaction.reply({
      content: "You are not in the game.",
      ephemeral: true
    });
    return false;
  }

  if (!isVisiblePresence(member)) {
    await removeSessionRoles(member, "CNR AI Hub: member went offline/invisible during active play.");
    await interaction.reply({
      content:
        "CNR gameplay is blocked while your Discord status is offline or invisible. Your Online Players role was removed. Go visible, then login again.",
      ephemeral: true
    });
    return false;
  }

  if (member.roles.cache.has(discordRoleIds.cnrMuted)) {
    await removeClassRoles(member, "CNR AI Hub: muted player cannot keep a class role.");
    await interaction.reply({
      content: "You are CNR muted. You can stay logged in, but you cannot use CNR gameplay commands or hold a class role until the mute expires.",
      ephemeral: true
    });
    return false;
  }

  return true;
}

export function isVisiblePresence(member: GuildMember) {
  const status = member.guild.presences.cache.get(member.id)?.status;
  return status === "online" || status === "idle" || status === "dnd";
}

export async function removeOnlineRoleForInvisible(member: GuildMember, status: PresenceStatusData | "offline") {
  if (status !== "offline" && status !== "invisible") return;
  if (!member.roles.cache.has(discordRoleIds.online)) return;
  await removeSessionRoles(member, "CNR AI Hub: member went offline/invisible during active play.");
  await removeClassRoles(member, "CNR AI Hub: member went offline/invisible during active play.");
  await member.roles.remove(discordRoleIds.outside, "CNR AI Hub: member went offline/invisible during active play.").catch(() => null);
}

async function registerPlayer(interaction: ButtonInteraction, member: GuildMember) {
  await ensureAuthRoles(member.guild);
  if (hasDiscordRole(member, "registered")) {
    await interaction.editReply({ content: "u already registered" });
    return;
  }

  await upsertDiscordUser(interaction.user, interaction.guild, member);
  await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
  await grantVirtualRole(interaction.user.id, interaction.guildId || "", roleKeys.registered, "auth_panel");
  await addDiscordRole(member, "registered", "CNR AI Hub registration.");

  await interaction.editReply({ content: "Registered. Your CNR player account is now linked to your Discord user ID." });
}

async function loginPlayer(interaction: ButtonInteraction, member: GuildMember) {
  await ensureAuthRoles(member.guild);

  if (!hasDiscordRole(member, "registered")) {
    await interaction.editReply({ content: "you are not registered" });
    return;
  }

  if (hasDiscordRole(member, "online")) {
    await interaction.editReply({ content: "you are already in game" });
    return;
  }

  if (!isVisiblePresence(member)) {
    await interaction.editReply({
      content:
        "Login blocked: your Discord status looks offline or invisible. CNR does not allow invisible gameplay. Set your status visible, then login again."
    });
    return;
  }

  await upsertDiscordUser(interaction.user, interaction.guild, member);
  const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
  profile.current_interior = "";
  await saveGameProfile(profile);
  await removeInteriorDiscordRoles(member);
  await addDiscordRole(member, "online", "CNR AI Hub login.");
  await member.roles.add(discordRoleIds.outside, "CNR AI Hub login: player is outside.").catch(() => null);

  await interaction.editReply({
    content:
      "Logged in. Choose the class you need to spawn in. Hitman and FBI require their registered class role.",
    components: [classRow()]
  });
}

async function quitPlayer(interaction: ButtonInteraction, member: GuildMember) {
  if (!hasDiscordRole(member, "online")) {
    await interaction.editReply({ content: "you are not in the game" });
    return;
  }

  await removeSessionRoles(member, "CNR AI Hub quit.");
  await removeClassRoles(member, "CNR AI Hub quit.");
  await member.roles.remove(discordRoleIds.outside, "CNR AI Hub quit.").catch(() => null);
  await revokeVirtualRole(interaction.user.id, interaction.guildId || "", roleKeys.cop);
  await revokeVirtualRole(interaction.user.id, interaction.guildId || "", roleKeys.robber);
  await revokeVirtualRole(interaction.user.id, interaction.guildId || "", roleKeys.fbi);
  await revokeVirtualRole(interaction.user.id, interaction.guildId || "", roleKeys.hitman);
  await revokeVirtualRole(interaction.user.id, interaction.guildId || "", roleKeys.suspect);
  await revokeVirtualRole(interaction.user.id, interaction.guildId || "", roleKeys.mostWanted);
  await revokeVirtualRole(interaction.user.id, interaction.guildId || "", roleKeys.cuffed);
  await revokeVirtualRole(interaction.user.id, interaction.guildId || "", roleKeys.jailed);
  await revokeVirtualRole(interaction.user.id, interaction.guildId || "", roleKeys.dead);

  const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
  const stats = getStats(profile);
  const quittingAsCriminal = profile.active_mode === "robber" || profile.active_mode === "hitman" || hasDiscordRole(member, "robber") || hasDiscordRole(member, "hitman");
  stats.suspended_suspect = quittingAsCriminal && hasAnyGameStatus(member, ["Suspected", "Suspect"]) ? 1 : 0;
  stats.suspended_most_wanted = quittingAsCriminal && hasAnyGameStatus(member, ["Most Wanted", "MostWanted", "Mostwanted"]) ? 1 : 0;
  setStats(profile, stats);
  const inventory = getInventory(profile);
  const insured = inventory.some((item) => item.name === "Insurance") || (await hasVirtualRole(interaction.user.id, interaction.guildId || "", roleKeys.insurance));
  profile.active_mode = "";
  profile.current_interior = "";
  profile.is_dead = false;
  if (!insured) setInventory(profile, []);
  await saveGameProfile(profile);
  await removeInteriorDiscordRoles(member);
  await removeStatusDiscordRoles(member);
  await removeInventoryRoles(member, interaction.user.id, interaction.guildId || "");

  await interaction.editReply({ content: insured ? "You quit the CNR game. Insurance kept your inventory safe." : "You quit the CNR game. Insurance is needed to keep guns and items after quitting." });
}

async function chooseClass(interaction: ButtonInteraction, member: GuildMember, selectedMode: string) {
  const mode = selectedMode as keyof typeof gameModes;
  if (!Object.keys(gameModes).includes(mode)) {
    await interaction.editReply({ content: "Unknown class selected." });
    return;
  }

  if (!hasDiscordRole(member, "online")) {
    await interaction.editReply({ content: "Login first before choosing a class." });
    return;
  }

  if (!isVisiblePresence(member)) {
    await interaction.editReply({ content: "You cannot spawn while offline or invisible. Set your status visible and login again." });
    return;
  }

  if (member.roles.cache.has(discordRoleIds.cnrMuted)) {
    await removeClassRoles(member, "CNR AI Hub: muted player tried to spawn.");
    await interaction.editReply({ content: "You are CNR muted. You cannot choose a class until the mute expires." });
    return;
  }

  const existingClassRoles = getClassRoleNames(member);
  if (existingClassRoles.length) {
    await interaction.editReply({ content: `You already spawned as ${existingClassRoles.join(", ")}. Use Quit before choosing another class.` });
    return;
  }

  if (mode === "hitman" && !hasDiscordRole(member, "hitmanRegistered")) {
    await interaction.editReply({ content: "Hitman spawn requires the Hitman-Registered role." });
    return;
  }

  if (mode === "fbi" && !hasDiscordRole(member, "fbiRegistered")) {
    await interaction.editReply({ content: "FBI spawn requires the FBI-Registered role." });
    return;
  }

  const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
  profile.active_mode = mode;
  applyClassHealthCap(member, profile);
  await saveGameProfile(profile);
  await addDiscordRole(member, mode, `CNR AI Hub spawned as ${mode}.`);
  await grantVirtualRole(interaction.user.id, interaction.guildId || "", gameModes[mode], "class_spawn");
  if (!profile.current_interior) await member.roles.add(discordRoleIds.outside, "CNR AI Hub spawn: player is outside.").catch(() => null);
  await restoreInventoryRoles(member, interaction.user.id, interaction.guildId || "", profile);
  await restoreSuspendedCrimeStatus(interaction.user.id, interaction.guildId || "", member, profile);

  await interaction.editReply({ content: `Spawned as ${mode.toUpperCase()}.` });
}

function applyClassHealthCap(member: GuildMember, profile: Awaited<ReturnType<typeof getOrCreateGameProfile>>) {
  const boosted = profile.active_mode === "fbi" || profile.active_mode === "hitman" || member.roles.cache.has(discordRoleIds.gameVip);
  profile.max_health = boosted ? 200 : 100;
  profile.health = profile.max_health;
}

async function addDiscordRole(member: GuildMember, roleKey: keyof typeof discordRoleNames, reason: string) {
  const roleId = findRoleId(member.guild, roleKey);
  if (!roleId) throw new Error(`Missing Discord role: ${discordRoleNames[roleKey]}`);
  await member.roles.add(roleId, reason);
}

function authPanelEmbed() {
  return new EmbedBuilder()
    .setTitle("CNR Game Login")
    .setDescription(
      [
        "Register your CNR account, login before playing, and quit when you leave the game.",
        "",
        "**Invisible/offline gameplay is not allowed.** If staff catch someone logged into the game while offline or invisible, it is punishable and they should quit immediately."
      ].join("\n")
    )
    .setColor(0x55beff);
}

function authPanelRows() {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("cnr_auth_register").setLabel("Register account").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("cnr_auth_login").setLabel("Login").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("cnr_auth_quit").setLabel("Quit").setStyle(ButtonStyle.Danger)
    )
  ];
}

function classRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("cnr_class_cop").setLabel("Cop").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("cnr_class_robber").setLabel("Robber").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("cnr_class_fbi").setLabel("FBI").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("cnr_class_hitman").setLabel("Hitman").setStyle(ButtonStyle.Danger)
  );
}

function hasDiscordRole(member: GuildMember, roleKey: keyof typeof discordRoleNames) {
  const roleId = findRoleId(member.guild, roleKey);
  return Boolean(roleId && member.roles.cache.has(roleId));
}

function findRoleId(guild: Guild, roleKey: keyof typeof discordRoleNames) {
  if (roleKey === "registered") return guild.roles.cache.get(discordRoleIds.registered)?.id;
  if (roleKey === "online") return guild.roles.cache.get(discordRoleIds.online)?.id;
  const roleName = discordRoleNames[roleKey];
  return guild.roles.cache.find((role) => role.name.toLowerCase() === roleName.toLowerCase())?.id;
}

async function removeSessionRoles(member: GuildMember, reason: string) {
  await member.roles.remove(discordRoleIds.online, reason).catch(() => null);
}

async function removeClassRoles(member: GuildMember, reason: string) {
  const roleIds = classRoleKeys.map((roleKey) => findRoleId(member.guild, roleKey)).filter((roleId): roleId is string => Boolean(roleId));
  if (roleIds.length) await member.roles.remove(roleIds, reason).catch(() => null);
}

function getClassRoleNames(member: GuildMember) {
  return classRoleKeys.filter((roleKey) => hasDiscordRole(member, roleKey)).map((roleKey) => discordRoleNames[roleKey]);
}

function hasAnyGameStatus(member: GuildMember, roleNames: string[]) {
  return roleNames.some((roleName) => member.roles.cache.some((role) => role.name.toLowerCase() === roleName.toLowerCase()));
}

async function removeStatusDiscordRoles(member: GuildMember) {
  const names = ["Suspected", "Suspect", "Most Wanted", "MostWanted", "Mostwanted", "Cuffed", "Jailed", "Dead"];
  const roles = names
    .map((name) => member.guild.roles.cache.find((role) => role.name.toLowerCase() === name.toLowerCase()))
    .filter((role): role is NonNullable<typeof role> => Boolean(role));
  if (roles.length) await member.roles.remove(roles, "CNR AI Hub quit.").catch(() => null);
  await member.roles.remove(Object.values(gameStatusRoleIds), "CNR AI Hub quit.").catch(() => null);
}

async function removeInteriorDiscordRoles(member: GuildMember) {
  for (const interior of interiors) {
    const role =
      (interior.discordRoleId ? member.guild.roles.cache.get(interior.discordRoleId) || (await member.guild.roles.fetch(interior.discordRoleId).catch(() => null)) : null) ||
      member.guild.roles.cache.find((cachedRole) => cachedRole.name.toLowerCase() === interior.discordRoleName.toLowerCase());
    if (role) await member.roles.remove(role, "CNR AI Hub quit.").catch(() => null);
  }
}

async function addDiscordRoleById(member: GuildMember, roleId: string, reason: string) {
  const role = member.guild.roles.cache.get(roleId) || (await member.guild.roles.fetch(roleId).catch(() => null));
  if (role) await member.roles.add(role, reason).catch(() => null);
}

async function removeDiscordRoleById(member: GuildMember, roleId: string, reason: string) {
  if (!member.roles.cache.has(roleId)) return;
  await member.roles.remove(roleId, reason).catch(() => null);
}

type ShopItemConfig = (typeof shopItems)[keyof typeof shopItems];

async function findDiscordRoleByExactName(member: GuildMember, roleName: string) {
  if (!member.guild.roles.cache.some((role) => role.name.toLowerCase() === roleName.toLowerCase())) {
    await member.guild.roles.fetch().catch(() => null);
  }
  return member.guild.roles.cache.find((role) => role.name.toLowerCase() === roleName.toLowerCase()) || null;
}

async function addShopItemDiscordRole(member: GuildMember, item: ShopItemConfig, reason: string) {
  if ("discordRoleId" in item) {
    await addDiscordRoleById(member, item.discordRoleId, reason);
    return;
  }
  const role = await findDiscordRoleByExactName(member, item.name);
  if (role) await member.roles.add(role, reason).catch(() => null);
}

async function removeShopItemDiscordRole(member: GuildMember, item: ShopItemConfig, reason: string) {
  if ("discordRoleId" in item) {
    await removeDiscordRoleById(member, item.discordRoleId, reason);
    return;
  }
  const role = await findDiscordRoleByExactName(member, item.name);
  if (role) await member.roles.remove(role, reason).catch(() => null);
}

async function removeInventoryRoles(member: GuildMember, userId: string, guildId: string) {
  for (const weapon of Object.values(weapons)) {
    await revokeVirtualRole(userId, guildId, weapon.roleKey);
    await removeDiscordRoleById(member, weapon.discordRoleId, `CNR AI Hub: removed ${weapon.name}.`);
  }
  for (const item of Object.values(shopItems)) {
    await revokeVirtualRole(userId, guildId, item.roleKey);
    await removeShopItemDiscordRole(member, item, `CNR AI Hub: removed ${item.name}.`);
  }
}

async function restoreInventoryRoles(member: GuildMember, userId: string, guildId: string, profile: Awaited<ReturnType<typeof getOrCreateGameProfile>>) {
  for (const item of getInventory(profile)) {
    const weapon = Object.values(weapons).find((candidate) => candidate.name.toLowerCase() === item.name.toLowerCase());
    if (weapon) {
      await grantVirtualRole(userId, guildId, weapon.roleKey, "inventory_restore");
      await addDiscordRoleById(member, weapon.discordRoleId, `CNR AI Hub: restored ${weapon.name}.`);
    }
    const shopItem = Object.values(shopItems).find((candidate) => candidate.name.toLowerCase() === item.name.toLowerCase());
    if (shopItem) {
      await grantVirtualRole(userId, guildId, shopItem.roleKey, "inventory_restore");
      await addShopItemDiscordRole(member, shopItem, `CNR AI Hub: restored ${shopItem.name}.`);
    }
  }
}

async function restoreSuspendedCrimeStatus(userId: string, guildId: string, member: GuildMember, profile: Awaited<ReturnType<typeof getOrCreateGameProfile>>) {
  const criminalClass = profile.active_mode === "robber" || profile.active_mode === "hitman" || hasDiscordRole(member, "robber") || hasDiscordRole(member, "hitman");
  const stats = getStats(profile);
  if (!criminalClass) {
    stats.suspended_suspect = 0;
    stats.suspended_most_wanted = 0;
    setStats(profile, stats);
    await saveGameProfile(profile);
    return;
  }
  if (stats.suspended_suspect) {
    await grantVirtualRole(userId, guildId, roleKeys.suspect, "crime_status_restore");
    await addStatusDiscordRole(member, ["Suspected", "Suspect"]);
  }
  if (stats.suspended_most_wanted) {
    await grantVirtualRole(userId, guildId, roleKeys.mostWanted, "crime_status_restore");
    await addStatusDiscordRole(member, ["Most Wanted", "MostWanted", "Mostwanted"]);
  }
  stats.suspended_suspect = 0;
  stats.suspended_most_wanted = 0;
  setStats(profile, stats);
  await saveGameProfile(profile);
}

async function addStatusDiscordRole(member: GuildMember, roleNames: string[]) {
  for (const roleName of roleNames) {
    const role = member.guild.roles.cache.find((cachedRole) => cachedRole.name.toLowerCase() === roleName.toLowerCase());
    if (role) {
      await member.roles.add(role, `CNR AI Hub: restored ${role.name}.`).catch(() => null);
      return;
    }
  }
}

async function repostPanelAfterClick(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  await repostAuthPanel(interaction.guild).catch((error) => {
    console.warn(`CNR access panel repost skipped: ${error instanceof Error ? error.message : "unknown error"}`);
  });
}

function isAuthButton(customId: string) {
  return customId === "cnr_auth_register" || customId === "cnr_auth_login" || customId === "cnr_auth_quit" || customId.startsWith("cnr_class_");
}
