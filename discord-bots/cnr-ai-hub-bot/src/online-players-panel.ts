import { ChannelType, EmbedBuilder, Guild, GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import { discordRoleIds, discordRoleNames } from "./auth-panel.js";

export const onlinePlayersChannelId = "1514206359782948936";

const panelTitle = "CNR Online Players";

export async function updateOnlinePlayersPanel(guild: Guild) {
  await guild.roles.fetch().catch(() => null);
  const fetchedMembers = await guild.members.fetch().catch(() => null);
  const memberSource = fetchedMembers || guild.members.cache;

  const channel = await guild.channels.fetch(onlinePlayersChannelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const onlinePlayers = memberSource
    .filter((member) => !member.user.bot && member.roles.cache.has(discordRoleIds.online))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const embed = new EmbedBuilder()
    .setTitle(panelTitle)
    .setColor(0x40dfa7)
    .setDescription(formatOnlinePlayers([...onlinePlayers.values()]))
    .addFields(...formatOnlinePlayerFields([...onlinePlayers.values()]))
    .addFields({ name: "Total Online Players", value: String(onlinePlayers.size), inline: true })
    .setFooter({ text: "Auto-edits every 1 minute and whenever players login, quit, or change class." })
    .setTimestamp();

  const textChannel = channel as TextChannel;
  const messages = await textChannel.messages.fetch({ limit: 25 }).catch(() => null);
  const existing = messages?.find((message) => message.author.id === guild.client.user.id && message.embeds[0]?.title === panelTitle);
  if (existing) {
    await existing.edit({ embeds: [embed] });
  } else {
    await textChannel.send({ embeds: [embed] });
  }
}

export function onlinePlayerRolesChanged(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
  const watchedRoleNames = [discordRoleNames.online, discordRoleNames.robber, discordRoleNames.cop, discordRoleNames.fbi, discordRoleNames.hitman];
  return watchedRoleNames.some((roleName) => hasRoleChanged(oldMember, newMember, roleName));
}

function formatOnlinePlayers(members: GuildMember[]) {
  if (!members.length) {
    return ["**Online Players List:-**", "", "No online players right now."].join("\n");
  }

  return [
    "**Online Players List:-**",
    "",
    "Players are shown below from the current **Online Players** role.",
    "The class is read from the active class role."
  ].join("\n");
}

function formatOnlinePlayerFields(members: GuildMember[]) {
  if (!members.length) return [];

  const visibleMembers = members.slice(0, 24);
  const fields = visibleMembers.map((member, index) => {
    const name = cleanCell(member.displayName, 40);
    const username = cleanCell(member.user.username, 40);
    const classMention = currentClassMention(member);

    return {
      name: `${index + 1}. ${name}`,
      value: [`Username: **${username}**`, `Class: ${classMention}`].join("\n"),
      inline: false
    };
  });

  if (members.length > visibleMembers.length) {
    fields.push({
      name: "More Players",
      value: `${members.length - visibleMembers.length} more online players are hidden to keep this embed readable.`,
      inline: false
    });
  }

  return fields;
}

function currentClassMention(member: GuildMember) {
  for (const roleName of [discordRoleNames.robber, discordRoleNames.hitman, discordRoleNames.fbi, discordRoleNames.cop]) {
    const role = member.roles.cache.find((cachedRole) => cachedRole.name.toLowerCase() === roleName.toLowerCase());
    if (role) return role.toString();
  }
  return "None";
}

function hasRoleChanged(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember, roleName: string) {
  return hasDiscordRole(oldMember, roleName) !== hasDiscordRole(newMember, roleName);
}

function hasDiscordRole(member: GuildMember | PartialGuildMember, roleName: string) {
  return member.roles.cache.some((role) => role.name.toLowerCase() === roleName.toLowerCase());
}

function cleanCell(value: string, maxLength: number) {
  const cleaned = value.replace(/\s+/g, " ").replace(/\|/g, "/").trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned;
}
