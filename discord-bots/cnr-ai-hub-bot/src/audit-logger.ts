import {
  AuditLogEvent,
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  Guild,
  GuildMember,
  Message,
  PartialGuildMember,
  PartialMessage,
  PartialUser,
  TextChannel,
  User
} from "discord.js";

export const realAuditLogsChannelId = "1515052456717844491";

const auditColor = 0x74c0fc;
const dangerColor = 0xff6b5f;
const warnColor = 0xffd166;
const okColor = 0x40dfa7;

export function registerAuditLogger(client: Client) {
  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;
    const executorId = await findAuditExecutor(message.guild, AuditLogEvent.MessageDelete, message.author?.id);
    await sendAudit(
      message.guild,
      new EmbedBuilder()
        .setTitle("Message Deleted")
        .setColor(dangerColor)
        .setDescription(message.content ? trim(message.content, 1200) : "No cached message content.")
        .addFields(
          { name: "Author", value: message.author ? `<@${message.author.id}>` : "Unknown", inline: true },
          { name: "Channel", value: `<#${message.channelId}>`, inline: true },
          { name: "Message ID", value: message.id, inline: true }
        )
        .setFooter({ text: executorId ? `Deleted by ${executorId}` : "Deleted by unknown or self-delete" })
        .setTimestamp()
    );
  });

  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!newMessage.guild || newMessage.author?.bot) return;
    const before = messageContent(oldMessage);
    const after = messageContent(newMessage);
    if (!before || !after || before === after) return;
    await sendAudit(
      newMessage.guild,
      new EmbedBuilder()
        .setTitle("Message Edited")
        .setColor(warnColor)
        .addFields(
          { name: "Author", value: `<@${newMessage.author.id}>`, inline: true },
          { name: "Channel", value: `<#${newMessage.channelId}>`, inline: true },
          { name: "Before", value: trim(before, 900), inline: false },
          { name: "After", value: trim(after, 900), inline: false }
        )
        .setTimestamp()
    );
  });

  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    await logRoleChanges(oldMember, newMember);
    await logNicknameChange(oldMember, newMember);
    await logGuildAvatarChange(oldMember, newMember);
  });

  client.on(Events.UserUpdate, async (oldUser, newUser) => {
    for (const guild of newUser.client.guilds.cache.values()) {
      const member = await guild.members.fetch(newUser.id).catch(() => null);
      if (!member) continue;
      await logUserProfileChange(guild, oldUser, newUser);
    }
  });
}

async function logRoleChanges(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
  const oldRoles = new Set(oldMember.roles.cache.keys());
  const newRoles = new Set(newMember.roles.cache.keys());
  const added = [...newRoles].filter((roleId) => !oldRoles.has(roleId));
  const removed = [...oldRoles].filter((roleId) => !newRoles.has(roleId));
  if (!added.length && !removed.length) return;
  const executorId = await findAuditExecutor(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id);
  await sendAudit(
    newMember.guild,
    new EmbedBuilder()
      .setTitle("Member Roles Updated")
      .setColor(added.length ? okColor : warnColor)
      .setDescription(`<@${newMember.id}>`)
      .addFields(
        { name: "Added", value: added.length ? added.map((roleId) => `<@&${roleId}>`).join("\n").slice(0, 1000) : "None", inline: true },
        { name: "Removed", value: removed.length ? removed.map((roleId) => `<@&${roleId}>`).join("\n").slice(0, 1000) : "None", inline: true },
        { name: "User ID", value: newMember.id, inline: true }
      )
      .setFooter({ text: executorId ? `Executor ${executorId}` : "Executor unknown" })
      .setThumbnail(newMember.displayAvatarURL())
      .setTimestamp()
  );
}

async function logNicknameChange(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
  if ((oldMember.nickname || "") === (newMember.nickname || "")) return;
  const executorId = await findAuditExecutor(newMember.guild, AuditLogEvent.MemberUpdate, newMember.id);
  await sendAudit(
    newMember.guild,
    new EmbedBuilder()
      .setTitle("Nickname Changed")
      .setColor(auditColor)
      .setDescription(`<@${newMember.id}>`)
      .addFields(
        { name: "Before", value: oldMember.nickname || newMember.user.username, inline: true },
        { name: "After", value: newMember.nickname || newMember.user.username, inline: true },
        { name: "User ID", value: newMember.id, inline: true }
      )
      .setFooter({ text: executorId ? `Executor ${executorId}` : "Executor unknown" })
      .setThumbnail(newMember.displayAvatarURL())
      .setTimestamp()
  );
}

async function logGuildAvatarChange(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
  if ((oldMember.avatar || "") === (newMember.avatar || "")) return;
  await sendAudit(
    newMember.guild,
    new EmbedBuilder()
      .setTitle("Server Profile Avatar Changed")
      .setColor(auditColor)
      .setDescription(`<@${newMember.id}>`)
      .addFields({ name: "User ID", value: newMember.id, inline: true })
      .setThumbnail(newMember.displayAvatarURL())
      .setImage(newMember.displayAvatarURL({ size: 1024 }))
      .setTimestamp()
  );
}

async function logUserProfileChange(guild: Guild, oldUser: User | PartialUser, newUser: User) {
  const usernameChanged = oldUser.username !== newUser.username;
  const avatarChanged = oldUser.avatar !== newUser.avatar;
  if (!usernameChanged && !avatarChanged) return;
  const auditEmbed = new EmbedBuilder()
    .setTitle(usernameChanged ? "Username Changed" : "Avatar Changed")
    .setColor(auditColor)
    .setDescription(`<@${newUser.id}>`)
    .addFields({ name: "User ID", value: newUser.id, inline: true })
    .setThumbnail(newUser.displayAvatarURL())
    .setTimestamp();
  if (usernameChanged) {
    auditEmbed.addFields(
      { name: "Before", value: oldUser.username || "Unknown", inline: true },
      { name: "After", value: newUser.username, inline: true }
    );
  }
  if (avatarChanged) {
    auditEmbed.setImage(newUser.displayAvatarURL({ size: 1024 }));
  }
  await sendAudit(guild, auditEmbed);
}

async function sendAudit(guild: Guild, embed: EmbedBuilder) {
  const channel = await guild.channels.fetch(realAuditLogsChannelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return;
  await (channel as TextChannel).send({ embeds: [embed] }).catch(() => null);
}

async function findAuditExecutor(guild: Guild, type: AuditLogEvent, targetId?: string) {
  const logs = await guild.fetchAuditLogs({ type, limit: 5 }).catch(() => null);
  const entry = logs?.entries.find((item) => (!targetId || item.targetId === targetId) && Date.now() - item.createdTimestamp < 15000);
  return entry?.executorId || "";
}

function messageContent(message: Message | PartialMessage) {
  return "content" in message ? message.content || "" : "";
}

function trim(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}
