import { ChannelType, EmbedBuilder, GuildMember, PartialGuildMember, TextChannel } from "discord.js";

export const welcomeChannelId = "1514206340430565396";
export const leaveChannelId = "1515054957881987235";

const welcomeGifs = [
  "https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/3o7abB06u9bNzA8lu8/giphy.gif"
];

const leaveGifs = [
  "https://media.giphy.com/media/kaBU6pgv0OsPHz2yxy/giphy.gif",
  "https://media.giphy.com/media/LTFbyWuELIlqlXGLeZ/giphy.gif",
  "https://media.giphy.com/media/26ufcVAp3AiJJsrIs/giphy.gif"
];

export async function sendWelcomeMessage(member: GuildMember) {
  const channel = await fetchTextChannel(member, welcomeChannelId);
  if (!channel) return;

  const createdAt = Math.floor(member.user.createdTimestamp / 1000);
  const joinedAt = Math.floor(Date.now() / 1000);
  const embed = new EmbedBuilder()
    .setColor(0x40dfa7)
    .setAuthor({ name: "CNR - Discord AI Hub", iconURL: member.guild.iconURL() || undefined })
    .setTitle(`Welcome, ${member.user.username}`)
    .setDescription(
      [
        `Glad to have you here, <@${member.id}>.`,
        "",
        "Start by reading the rules, then open the CNR game panel to register and login.",
        "",
        `Member Count: **${member.guild.memberCount.toLocaleString("en-US")}**`
      ].join("\n")
    )
    .addFields(
      { name: "Account Created", value: `<t:${createdAt}:R>`, inline: true },
      { name: "Joined Server", value: `<t:${joinedAt}:F>`, inline: true },
      { name: "Start Here", value: "<#1514396788637827082>\n<#1514206378900590693>", inline: true }
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setImage(randomItem(welcomeGifs))
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp();

  await channel.send({ content: `<@${member.id}>`, embeds: [embed] });
}

export async function sendLeaveMessage(member: GuildMember | PartialGuildMember) {
  const channel = await fetchTextChannel(member, leaveChannelId);
  if (!channel) return;

  const joinedAt = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
  const embed = new EmbedBuilder()
    .setColor(0xff6b5f)
    .setAuthor({ name: "Member Left", iconURL: member.guild.iconURL() || undefined })
    .setTitle(`${member.user.username} left the server`)
    .setDescription(`A member has left **${member.guild.name}**.`)
    .addFields(
      { name: "User", value: `<@${member.id}>`, inline: true },
      { name: "User ID", value: member.id, inline: true },
      { name: "Joined", value: joinedAt ? `<t:${joinedAt}:R>` : "Unknown", inline: true }
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setImage(randomItem(leaveGifs))
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

async function fetchTextChannel(member: GuildMember | PartialGuildMember, channelId: string) {
  const channel = await member.guild.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return null;
  return channel as TextChannel;
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}
