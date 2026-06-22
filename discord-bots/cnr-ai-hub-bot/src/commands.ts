import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  TextChannel
} from "discord.js";
import { rememberUserNote, upsertDiscordUser } from "./appwrite.js";
import { discordRoleIds, discordRoleNames } from "./auth-panel.js";
import { gameModes, interiors, roleKeys, shopItems, weapons } from "./game-config.js";
import {
  addGameAction,
  addExperience,
  addTransaction,
  checkCooldown,
  createGiveaway,
  createModerationCase,
  createTicket,
  getInventory,
  getStats,
  getOrCreateGameProfile,
  grantVirtualRole,
  hasVirtualRole,
  listModerationCases,
  revokeVirtualRole,
  saveGameProfile,
  setInventory,
  setStats,
  updateGiveaway,
  updateTicket,
  xpForLevel
} from "./game-store.js";

type CommandDefinition = {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

const ok = 0x40dfa7;
const warn = 0xffd166;
const danger = 0xff6b5f;
const info = 0x74c0fc;
const punishmentLogsChannelId = "1514685918811000933";
const gameModerationChannelId = "1514809733889003642";
const serverModerationChannelId = "1514809760652857544";
const copsRadioChannelId = "1516527524082094190";
const moderationRoleIds = {
  gameModerator: "1514681849971216586",
  communityModerator: "1514681998424277073",
  communityAdministrator: "1514681558961750066",
  communityOwner: "1514219182286438532",
  gameVip: "1514393670705479730",
  cnrMuted: "1514206082971598929",
  cnrBanned: "1514206078567579689"
} as const;
const privateReplyCommands = new Set([
  "ping",
  "profile",
  "remember",
  "resource",
  "commands",
  "balance",
  "clearinventory",
  "enter",
  "exit",
  "interiors",
  "panic",
  "quit",
  "gameinfo",
  "stats",
  "myhealth",
  "setupticket",
  "giveawayreroll",
  "ticket"
]);

SlashCommandBuilder.prototype.toCommand = function toCommand(execute) {
  return { data: this, execute };
};

export const commands: CommandDefinition[] = [
  simple("ping", "Check CNR AI Hub Bot health.", async (interaction) => {
    await interaction.reply({ embeds: [embed("CNR AI Hub", "Bot is online, slash commands are active, and Appwrite is connected.", ok)], ephemeral: true });
  }),
  simple("profile", "Show your stored CNR AI Hub profile.", async (interaction) => {
    const game = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    const member = interaction.member as GuildMember | null;
    if (member) await applyHealthCap(member, game);
    const nextLevelXp = xpForLevel(game.level);
    const hitmanRegistered = member ? hasDiscordRole(member, discordRoleNames.hitmanRegistered) : false;
    const fbiRegistered = member ? hasDiscordRole(member, discordRoleNames.fbiRegistered) : false;
    const registered = member ? hasDiscordRole(member, discordRoleNames.registered) : false;
    const online = member ? hasDiscordRole(member, discordRoleNames.online) : false;
    await interaction.editReply({
      embeds: [
        embed("CNR Player Profile", `<@${interaction.user.id}>`, info)
          .addFields(
            { name: "Level", value: `**${game.level}**`, inline: true },
            { name: "XP", value: `**${game.experience}/${nextLevelXp}**`, inline: true },
            { name: "Money", value: `**${money(game.currency)}**`, inline: true },
            { name: "Hitman Registered", value: yesNo(hitmanRegistered), inline: true },
            { name: "FBI Registered", value: yesNo(fbiRegistered), inline: true },
            { name: "Game Access", value: `Registered: **${yesNo(registered)}**\nOnline: **${yesNo(online)}**`, inline: true },
            { name: "Current Class", value: game.active_mode ? titleCase(game.active_mode) : "None", inline: true },
            { name: "Score", value: String(game.score), inline: true },
            { name: "Discord ID", value: interaction.user.id, inline: true }
          )
          .setFooter({ text: "Use /stats for health, armor, guns, items, and gameplay state." })
      ]
    });
  }),
  new SlashCommandBuilder()
    .setName("remember")
    .setDescription("Save a safe preference note to your CNR user memory.")
    .addStringOption((option) => option.setName("note").setDescription("Safe note to remember.").setRequired(true).setMaxLength(500))
    .toCommand(async (interaction) => {
      const note = interaction.options.getString("note", true);
      if (hasSecretLikeText(note)) {
        await interaction.reply({ content: "I will not store tokens, passwords, API keys, or sensitive private data.", ephemeral: true });
        return;
      }
      await rememberUserNote(interaction.user.id, note);
      await interaction.reply({ embeds: [embed("Memory Saved", "Saved that safe note to your profile.", ok)], ephemeral: true });
    }),
  new SlashCommandBuilder()
    .setName("resource")
    .setDescription("Get a CNR AI Hub resource suggestion.")
    .addStringOption((option) => option.setName("topic").setDescription("Optional topic.").setRequired(false))
    .toCommand(async (interaction) => {
      const topic = interaction.options.getString("topic") || "getting started";
      await interaction.reply({
        embeds: [
          embed(
            "CNR AI Hub Resource",
            `For **${topic}**, start with the website dashboard, \`docs/cnr-ai-discord-agents.yaml\`, and the Appwrite schema setup command: \`npm run appwrite:setup\`.`,
            info
          )
        ],
        ephemeral: true
      });
    }),
  simple("commands", "Show all available CNR AI Hub bot commands.", async (interaction) => {
    await interaction.reply({
      embeds: [
        embed("CNR Command Center", "Current live command list for CNR AI Hub. Commands are grouped by what players and staff need during gameplay.", info)
          .addFields(
            {
              name: "Start & Profile",
              value: commandList("ping", "profile", "remember", "resource", "commands", "register", "aboutme"),
              inline: false
            },
            {
              name: "Money & Inventory",
              value: commandList("balance", "daily", "work", "earn", "give", "itemshop", "luckyspin", "clearinventory"),
              inline: false
            },
            {
              name: "CNR Gameplay",
              value: commandList("cnr", "quit", "gameinfo", "stats", "weap", "interiors", "enter", "exit", "myhealth", "buyhealth", "buyarmor", "respawn"),
              inline: false
            },
            {
              name: "Crime & Combat",
              value: commandList("rob", "robstore", "bc", "breakcuffs", "picklockcuffs", "shot", "kill"),
              inline: false
            },
            {
              name: "Law Enforcement",
              value: commandList("panic", "cuff", "arrest", "jail", "taze"),
              inline: false
            },
            {
              name: "Staff Controls",
              value: commandList("calogs", "cwarn", "cmute", "ckick", "cban", "alogs", "warn", "mute", "kick", "ban", "cunban", "cunmute", "csuspend", "cunsuspend"),
              inline: false
            },
            {
              name: "Server Tools",
              value: commandList("ticket", "assignticket", "closeticket", "reopenticket", "setupticket", "giveaway", "giveawayreroll", "giveawaystop", "music"),
              inline: false
            }
          )
          .setFooter({ text: `${commands.length} commands online` })
      ],
      ephemeral: true
    });
  }),
  simple("register", "Register your CNR game profile and receive a welcome gift.", async (interaction) => {
    const member = interaction.member as GuildMember;
    const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    const firstRegistration = profile.currency === 0 && profile.experience === 0;
    if (firstRegistration) {
      profile.currency += 50000;
      profile.total_earned += 50000;
      await addTransaction({
        discordUserId: interaction.user.id,
        serverId: interaction.guildId,
        type: "registration_bonus",
        amount: 50000,
        balanceAfter: profile.currency
      });
    }
    await saveGameProfile(profile);
    await addRole(member, roleKeys.registered);
    await interaction.reply({ embeds: [embed("Profile Registered", `Welcome gift: **${firstRegistration ? money(50000) : money(0)}**. Balance: **${money(profile.currency)}**.`, ok)] });
  }),
  simple("balance", "Check your current currency balance.", async (interaction) => {
    const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    await interaction.reply({ embeds: [embed("Balance", `Your current balance is **${money(profile.currency)}**.`, ok)], ephemeral: true });
  }),
  simple("daily", "Claim your daily currency reward.", async (interaction) => {
    const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    const today = new Date().toDateString();
    if (profile.last_daily_claim_at && new Date(profile.last_daily_claim_at).toDateString() === today) {
      await interaction.reply({ embeds: [embed("Daily Already Claimed", "Come back tomorrow for the next daily reward.", warn)], ephemeral: true });
      return;
    }
    const amount = 25000;
    profile.currency += amount;
    profile.total_earned += amount;
    profile.last_daily_claim_at = new Date().toISOString();
    await saveGameProfile(profile);
    await addTransaction({ discordUserId: interaction.user.id, serverId: interaction.guildId, type: "daily", amount, balanceAfter: profile.currency });
    await interaction.reply({ embeds: [embed("Daily Claimed", `You claimed **${money(amount)}**. Balance: **${money(profile.currency)}**.`, ok)] });
  }),
  simple("work", "Work to earn currency. Cooldown: 2 minutes.", async (interaction) => {
    const cooldown = await checkCooldown("work", interaction.user.id, interaction.guildId || "", 2 * 60 * 1000);
    if (!cooldown.allowed) {
      await interaction.reply({ content: `Wait ${cooldown.secondsLeft}s before working again.`, ephemeral: true });
      return;
    }
    const amount = random(1000, 2000);
    const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    profile.currency += amount;
    profile.total_earned += amount;
    addExperience(profile, 10);
    await saveGameProfile(profile);
    await addTransaction({ discordUserId: interaction.user.id, serverId: interaction.guildId, type: "work", amount, balanceAfter: profile.currency });
    await interaction.reply({ embeds: [embed("Work Complete", `You earned **${money(amount)}** and **10 XP**.`, ok)] });
  }),
  new SlashCommandBuilder()
    .setName("earn")
    .setDescription("Admin: add currency to a user profile.")
    .addIntegerOption((option) => option.setName("amount").setDescription("Amount to add.").setRequired(true).setMinValue(1))
    .addUserOption((option) => option.setName("user").setDescription("Optional target user.").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toCommand(async (interaction) => {
      const target = interaction.options.getUser("user") || interaction.user;
      const amount = interaction.options.getInteger("amount", true);
      const profile = await getOrCreateGameProfile(target.id, interaction.guildId || "");
      profile.currency += amount;
      profile.total_earned += amount;
      await saveGameProfile(profile);
      await addTransaction({ discordUserId: target.id, serverId: interaction.guildId, type: "admin_earn", amount, balanceAfter: profile.currency });
      await interaction.reply({ embeds: [embed("Currency Added", `<@${target.id}> received **${money(amount)}**.`, ok)] });
    }),
  new SlashCommandBuilder()
    .setName("give")
    .setDescription("Give currency to another user.")
    .addUserOption((option) => option.setName("recipient").setDescription("Recipient.").setRequired(true))
    .addIntegerOption((option) => option.setName("amount").setDescription("Amount.").setRequired(true).setMinValue(1))
    .toCommand(async (interaction) => {
      const recipient = interaction.options.getUser("recipient", true);
      const amount = interaction.options.getInteger("amount", true);
      const sender = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
      const receiver = await getOrCreateGameProfile(recipient.id, interaction.guildId || "");
      if (sender.currency < amount) {
        await interaction.reply({ content: "You do not have enough currency.", ephemeral: true });
        return;
      }
      sender.currency -= amount;
      receiver.currency += amount;
      sender.total_spent += amount;
      receiver.total_earned += amount;
      await saveGameProfile(sender);
      await saveGameProfile(receiver);
      await addTransaction({ discordUserId: interaction.user.id, serverId: interaction.guildId, type: "give_sent", amount: -amount, balanceAfter: sender.currency, targetUserId: recipient.id });
      await addTransaction({ discordUserId: recipient.id, serverId: interaction.guildId, type: "give_received", amount, balanceAfter: receiver.currency, targetUserId: interaction.user.id });
      await interaction.reply({ embeds: [embed("Transfer Complete", `<@${interaction.user.id}> gave **${money(amount)}** to <@${recipient.id}>.`, ok)] });
    }),
  new SlashCommandBuilder()
    .setName("itemshop")
    .setDescription("Buy a game item.")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("Item to buy.")
        .setRequired(true)
        .addChoices(...Object.entries(shopItems).map(([value, item]) => ({ name: `${item.name} - ${money(item.price)}`, value })))
    )
    .toCommand(async (interaction) => {
      const itemKey = interaction.options.getString("item", true) as keyof typeof shopItems;
      const item = shopItems[itemKey];
      const result = await buyShopItem(interaction.member as GuildMember, interaction.user.id, interaction.guildId || "", itemKey, item);
      await interaction.reply({ embeds: [result.embed], ephemeral: true });
    }),
  simple("luckyspin", "Try your luck and win up to 10,000 currency. Cooldown: 1 hour.", async (interaction) => {
    const cooldown = await checkCooldown("luckyspin", interaction.user.id, interaction.guildId || "", 60 * 60 * 1000);
    if (!cooldown.allowed) {
      await interaction.reply({ content: `Wait ${Math.ceil(cooldown.secondsLeft / 60)} minute(s) before spinning again.`, ephemeral: true });
      return;
    }
    const reward = random(500, 10000);
    const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    profile.currency += reward;
    profile.total_earned += reward;
    await saveGameProfile(profile);
    await addTransaction({ discordUserId: interaction.user.id, serverId: interaction.guildId, type: "luckyspin", amount: reward, balanceAfter: profile.currency });
    await interaction.reply({ embeds: [embed("Lucky Spin", `You won **${money(reward)}**. Balance: **${money(profile.currency)}**.`, ok)] });
  }),
  simple("clearinventory", "Clear your inventory.", async (interaction) => {
    const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    setInventory(profile, []);
    await saveGameProfile(profile);
    await interaction.reply({ embeds: [embed("Inventory Cleared", "Your inventory is now empty.", warn)], ephemeral: true });
  }),
  simple("aboutme", "View your game profile.", async (interaction) => showAbout(interaction)),
  new SlashCommandBuilder()
    .setName("cnr")
    .setDescription("Join the Cops and Robbers game.")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Game mode.")
        .setRequired(true)
        .addChoices(
          { name: "Cop", value: "cop" },
          { name: "Robber", value: "robber" },
          { name: "FBI", value: "fbi" },
          { name: "Hitman", value: "hitman" }
        )
    )
    .toCommand(async (interaction) => {
      const mode = interaction.options.getString("mode", true) as keyof typeof gameModes;
      const member = interaction.member as GuildMember;
      if (mode === "hitman" && !hasDiscordRole(member, discordRoleNames.hitmanRegistered)) {
        return deny(interaction, "Hitman spawn requires the Hitman-Registered role.");
      }
      if (mode === "fbi" && !hasDiscordRole(member, discordRoleNames.fbiRegistered)) {
        return deny(interaction, "FBI spawn requires the FBI-Registered role.");
      }
      const existingClassRoles = getClassDiscordRoles(member);
      if (existingClassRoles.length) {
        return deny(interaction, `You already spawned as ${existingClassRoles.join(", ")}. Use /quit before choosing another class.`);
      }
      const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
      if (member.roles.cache.has(moderationRoleIds.cnrMuted)) {
        await removeClassDiscordRoles(member);
        await removeRoles(member, [...Object.values(gameModes)]);
        profile.active_mode = "";
        await saveGameProfile(profile);
        return deny(interaction, "You are CNR muted. You cannot choose a class until the mute expires.");
      }
      profile.active_mode = mode;
      await applyHealthCap(member, profile);
      await saveGameProfile(profile);
      await addDiscordRoleByName(member, modeRoleName(mode));
      await addRole(member, gameModes[mode]);
      if (!profile.current_interior) await addOutsideRole(member);
      await restoreInventoryRoles(member, profile);
      await restoreSuspendedCrimeStatus(member, profile);
      await interaction.reply({ embeds: [embed("Joined CNR", `You joined as **${mode.toUpperCase()}**.`, ok)] });
    }),
  simple("quit", "Quit the current game and revoke game roles.", async (interaction) => {
    const member = interaction.member as GuildMember;
      const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
      const stats = getStats(profile);
      const quittingAsCriminal = profile.active_mode === "robber" || profile.active_mode === "hitman" || hasDiscordRole(member, discordRoleNames.robber) || hasDiscordRole(member, discordRoleNames.hitman);
      stats.suspended_suspect = quittingAsCriminal && ((await hasRole(member, roleKeys.suspect)) || hasCrimeDiscordRole(member, "suspect")) ? 1 : 0;
      stats.suspended_most_wanted = quittingAsCriminal && ((await hasRole(member, roleKeys.mostWanted)) || hasCrimeDiscordRole(member, "mostWanted")) ? 1 : 0;
      setStats(profile, stats);
    await removeRoles(member, [...Object.values(gameModes), roleKeys.suspect, roleKeys.mostWanted, roleKeys.cuffed, roleKeys.jailed, roleKeys.dead]);
    await removeDiscordRole(member, discordRoleNames.online);
    await removeClassDiscordRoles(member);
      await removeOutsideRole(member);
      const insured = await hasRole(member, roleKeys.insurance);
      profile.active_mode = "";
      profile.current_interior = "";
      profile.is_dead = false;
      if (!insured) setInventory(profile, []);
      await saveGameProfile(profile);
      await removeInteriorDiscordRoles(member);
      await removeCrimeDiscordRoles(member);
      await sendChannelEmbeds(interaction, [embed("CNR Quit", `<@${interaction.user.id}> quit the CNR game.`, warn)]);
      await interaction.reply({ embeds: [embed("Quit CNR", insured ? "Your game and interior roles were removed. Insurance kept your inventory safe." : "Your game and interior roles were removed. Insurance is needed to keep guns and items after quitting.", warn)], ephemeral: true });
    }),
  simple("gameinfo", "Get information about roles and game rules.", async (interaction) => {
    await interaction.reply({
      embeds: [
        embed("CNR Game Info", "Choose a mode with `/cnr`, enter locations with `/enter`, earn money through jobs or robberies, and use law/crime commands based on your role.", info).addFields(
          { name: "Law", value: "Cop/FBI can cuff, jail, arrest, and taze suspects.", inline: false },
          { name: "Crime", value: "Robbers can rob stores, buy firearms, attack, and become suspects.", inline: false },
          { name: "Economy", value: "Daily, work, item shop, weapons, transfers, and lucky spin are stored in Appwrite.", inline: false }
        )
      ],
      ephemeral: true
    });
  }),
  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Display player stats.")
    .addUserOption((option) => option.setName("user").setDescription("Optional player.").setRequired(false))
    .toCommand(async (interaction) => {
      const user = interaction.options.getUser("user") || interaction.user;
      const profile = await getOrCreateGameProfile(user.id, interaction.guildId || "");
      const viewedMember = interaction.guild ? await interaction.guild.members.fetch(user.id).catch(() => null) : null;
      if (viewedMember) await applyHealthCap(viewedMember, profile);
      const isGameVip = Boolean(viewedMember && viewedMember.roles.cache.has(moderationRoleIds.gameVip));
      const inventory = getInventory(profile);
      const guns = inventory.filter((item) => item.type === "weapon" && isActiveWeapon(item.name));
      const items = inventory.filter((item) => item.type !== "weapon");
      await interaction.editReply({
        embeds: [
          embed("CNR Gameplay Stats", `<@${user.id}>`, info)
            .addFields(
              { name: "Condition", value: `Health **${profile.health}/${profile.max_health}**\nArmor **${profile.armor}/100**\nStatus **${profile.is_dead ? "Dead" : "Alive"}**`, inline: true },
              { name: "Game State", value: `Class **${profile.active_mode ? titleCase(profile.active_mode) : "None"}**\nInterior **${profile.current_interior || "None"}**`, inline: true },
              { name: "Loadout Summary", value: `Guns **${guns.length}**\nItems **${items.length}**\nGame V.I.P **${yesNo(isGameVip)}**`, inline: true },
              { name: "Guns", value: formatInventoryList(guns, true), inline: false },
              { name: "Items", value: formatInventoryList(items, false), inline: false },
              { name: "Crime Record", value: `Robbed **${money(profile.robbed_money)}**\nReturned **${money(profile.returned_money)}**`, inline: true },
              { name: "Progress", value: `Score **${profile.score}**\nLevel **${profile.level}**`, inline: true }
            )
            .setFooter({ text: "Use /profile for money, XP, level, and FBI/Hitman registration." })
        ]
      });
    }),
  new SlashCommandBuilder()
    .setName("weap")
    .setDescription("Buy a weapon using its ID.")
    .addIntegerOption((option) =>
      option
        .setName("id")
        .setDescription("Weapon ID.")
        .setRequired(true)
        .addChoices(...Object.entries(weapons).slice(0, 25).map(([id, weapon]) => ({ name: `${id}: ${weapon.name} - ${money(weapon.price)}`, value: Number(id) })))
    )
    .toCommand(async (interaction) => {
      const id = interaction.options.getInteger("id", true) as keyof typeof weapons;
      const weapon = weapons[id];
      if (!weapon) {
        await interaction.reply({ content: "Invalid weapon ID.", ephemeral: true });
        return;
      }
      const result = await buyWeapon(interaction.member as GuildMember, interaction.user.id, interaction.guildId || "", Number(id));
      await interaction.reply({ embeds: [result.embed], ephemeral: true });
    }),
  simple("interiors", "Open the CNR interior entry menu.", async (interaction) => {
    await interaction.editReply({
      embeds: [
        embed(
          "CNR Interiors",
          "Choose one interior to enter. If you are already inside an interior, use `/exit` first before entering another one.",
          info
        )
      ],
      components: interiorRows()
    });
  }),
  new SlashCommandBuilder()
    .setName("enter")
    .setDescription("Enter a specific interior.")
    .addStringOption((option) =>
      option
        .setName("interior")
        .setDescription("Interior to enter.")
        .setRequired(true)
        .addChoices(...interiors.slice(0, 25).map((interior) => ({ name: interior.name, value: interior.value })))
    )
    .toCommand(async (interaction) => {
      const selected = interiors.find((i) => i.value === interaction.options.getString("interior", true));
      if (!selected) {
        await interaction.reply({ content: "Invalid interior.", ephemeral: true });
        return;
      }
      const member = interaction.member as GuildMember;
      if ((await hasRole(member, roleKeys.jailed)) || (await hasRole(member, roleKeys.dead))) {
        await interaction.reply({ content: "You cannot enter while jailed or dead.", ephemeral: true });
        return;
      }
      const result = await enterInterior(member, interaction.user.id, interaction.guildId || "", selected);
      await sendInteriorPublicMessages(interaction, member, result.enteredInterior);
      await interaction.reply({ embeds: [result.embed], ephemeral: true });
    }),
  simple("exit", "Exit your current interior.", async (interaction) => {
    const member = interaction.member as GuildMember;
    const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    profile.current_interior = "";
    await saveGameProfile(profile);
    await removeInteriorDiscordRoles(member);
    await addOutsideRole(member);
    await sendChannelEmbeds(interaction, [embed("Interior Update", `<@${interaction.user.id}> left the interior.`, warn)]);
    await interaction.reply({ embeds: [embed("Interior Exited", "You left your current interior.", warn)], ephemeral: true });
  }),
  targetCommand("cuff", "Cuff a suspect.", "suspect", async (interaction, suspect) => {
    const member = interaction.member as GuildMember;
    if (!(await hasRole(member, roleKeys.cop))) return deny(interaction, "Only cops can cuff suspects.");
    if (!(await sameInterior(member, suspect))) return deny(interaction, "You must be in the same interior as the suspect.");
    await removeRoles(suspect, [roleKeys.suspect]);
    await addRole(suspect, roleKeys.cuffed);
    await addGameAction({ actorUserId: interaction.user.id, targetUserId: suspect.id, serverId: interaction.guildId, channelId: interaction.channelId, actionType: "cuff" });
    await interaction.reply({ embeds: [embed("Suspect Cuffed", `${suspect.displayName} has been cuffed.`, ok)] });
  }),
  targetCommand("arrest", "Arrest a cuffed suspect.", "suspect", async (interaction, suspect) => {
    const member = interaction.member as GuildMember;
    if (!(await hasRole(member, roleKeys.cop))) return deny(interaction, "Only cops can arrest suspects.");
    if (!(await hasRole(suspect, roleKeys.cuffed))) return deny(interaction, "The suspect must be cuffed first.");
    const reward = await rewardLawCapture(member, suspect, "arrest", interaction.guildId || "");
    await removeRoles(suspect, [roleKeys.cuffed, roleKeys.suspect, roleKeys.mostWanted]);
    await removeCrimeDiscordRoles(suspect);
    await addRole(suspect, roleKeys.jailed);
    await addGameAction({ actorUserId: interaction.user.id, targetUserId: suspect.id, serverId: interaction.guildId, channelId: interaction.channelId, actionType: "arrest" });
    await applyInventoryLossForJailOrDeath(suspect, "jail");
    await interaction.reply({ embeds: [embed("Suspect Arrested", `${suspect.displayName} has been arrested and jailed.${reward ? `\nReward: **${money(reward.money)}** and **${reward.xp} XP**.` : ""}`, ok)] });
  }),
  targetCommand("jail", "Jail a cuffed suspect.", "suspect", async (interaction, suspect) => {
    if (!(await hasRole(interaction.member as GuildMember, roleKeys.cop))) return deny(interaction, "Only cops can jail suspects.");
    if (!(await hasRole(suspect, roleKeys.cuffed))) return deny(interaction, "The suspect must be cuffed first.");
    const reward = await rewardLawCapture(interaction.member as GuildMember, suspect, "arrest", interaction.guildId || "");
    await removeRoles(suspect, [roleKeys.cuffed, roleKeys.suspect, roleKeys.mostWanted]);
    await removeCrimeDiscordRoles(suspect);
    await addRole(suspect, roleKeys.jailed);
    await addGameAction({ actorUserId: interaction.user.id, targetUserId: suspect.id, serverId: interaction.guildId, channelId: interaction.channelId, actionType: "jail" });
    await applyInventoryLossForJailOrDeath(suspect, "jail");
    await interaction.reply({ embeds: [embed("Suspect Jailed", `${suspect.displayName} has been jailed.${reward ? `\nReward: **${money(reward.money)}** and **${reward.xp} XP**.` : ""}`, ok)] });
  }),
  targetCommand("taze", "Taze a suspect.", "suspect", async (interaction, suspect) => {
    const member = interaction.member as GuildMember;
    if (!(await hasRole(member, roleKeys.fbi))) return deny(interaction, "Only FBI agents can taze suspects.");
    if (!(await sameInterior(member, suspect))) return deny(interaction, "You must be in the same interior as the suspect.");
    await addRole(suspect, roleKeys.frozen);
    setTimeout(() => void removeRoles(suspect, [roleKeys.frozen]), random(3, 5) * 1000);
    await addGameAction({ actorUserId: interaction.user.id, targetUserId: suspect.id, serverId: interaction.guildId, channelId: interaction.channelId, actionType: "taze" });
    await interaction.reply({ embeds: [embed("Suspect Tazed", `${suspect.displayName} was tazed and temporarily frozen.`, warn)] });
  }),
  new SlashCommandBuilder()
    .setName("panic")
    .setDescription("Call Cop and FBI backup to your location.")
    .addStringOption((option) =>
      option
        .setName("interior")
        .setDescription("Optional location override.")
        .setRequired(false)
        .addChoices(
          { name: "Outside", value: "outside" },
          ...interiors.map((interior) => ({ name: interior.name, value: interior.value }))
        )
    )
    .toCommand(async (interaction) => {
      const member = interaction.member as GuildMember;
      const isLaw = (await hasRole(member, roleKeys.cop)) || (await hasRole(member, roleKeys.fbi)) || hasDiscordRole(member, discordRoleNames.cop) || hasDiscordRole(member, discordRoleNames.fbi);
      if (!isLaw) return deny(interaction, "Only Cop and FBI players can use /panic.");
      const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
      const selected = interaction.options.getString("interior");
      const location = selected === "outside" ? "Outside" : selected ? interiors.find((interior) => interior.value === selected)?.name || "Outside" : currentLocation(member, profile.current_interior);
      await sendCopsRadioAlert(interaction, "Officer Panic", member, location, null, "An officer needs immediate backup.");
      await interaction.reply({ embeds: [embed("Panic Sent", `Cop and FBI backup was requested at **${location}**.`, danger)], ephemeral: true });
    }),
  targetCommand("kill", "Execute a hit on a marked target.", "target", async (interaction, target) => {
    if (!(await hasRole(interaction.member as GuildMember, roleKeys.hitman))) return deny(interaction, "Only hitmen can use this command.");
    await addRole(target, roleKeys.dead);
    await applyInventoryLossForJailOrDeath(target, "death");
    const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    profile.currency += 3000;
    profile.total_earned += 3000;
    addExperience(profile, 50);
    await markCrime(interaction.member as GuildMember, profile);
    await saveGameProfile(profile);
    await sendCopsRadioAlert(interaction, "Murder", interaction.member as GuildMember, currentLocation(interaction.member as GuildMember, profile.current_interior), target, "A Hitman completed a lethal contract.");
    await addTransaction({ discordUserId: interaction.user.id, serverId: interaction.guildId, type: "hitman_payment", amount: 3000, balanceAfter: profile.currency, targetUserId: target.id });
    await interaction.reply({ embeds: [embed("Contract Complete", `${target.displayName} was eliminated. Payment: **${money(3000)}**.`, ok)] });
  }),
  targetCommand("rob", "Rob another user.", "target", async (interaction, target) => {
    const member = interaction.member as GuildMember;
    const isRobber = (await hasRole(member, roleKeys.robber)) || hasDiscordRole(member, discordRoleNames.robber);
    const isHitman = (await hasRole(member, roleKeys.hitman)) || hasDiscordRole(member, discordRoleNames.hitman);
    if (!isRobber && !isHitman) return deny(interaction, "Only Robbers and Hitmen can rob players.");
    if (!(await sameInterior(member, target))) return deny(interaction, "You must be in the same interior as the player you want to rob.");
    if (await hasRole(target, roleKeys.wallet)) return deny(interaction, `${target.displayName} has a Wallet, so you cannot rob them.`);
    const robber = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    const victim = await getOrCreateGameProfile(target.id, interaction.guildId || "");
    const multiplier = crimeRewardMultiplier(member, isHitman);
    const amount = Math.min(victim.currency, Math.floor(random(1, 5000) * multiplier));
    const xpAmount = Math.floor(20 * multiplier);
    victim.currency -= amount;
    robber.currency += amount;
    robber.robbed_money += amount;
    robber.total_earned += amount;
    robber.score += 3;
    addExperience(robber, xpAmount);
    await saveGameProfile(robber);
    await saveGameProfile(victim);
    await markCrime(member, robber);
    await sendCopsRadioAlert(interaction, "Player Robbery", member, currentLocation(member, robber.current_interior), target, `${target.displayName} was robbed.`);
    await addTransaction({ discordUserId: interaction.user.id, serverId: interaction.guildId, type: "robbery", amount, balanceAfter: robber.currency, targetUserId: target.id });
    await interaction.reply({ embeds: [embed("Robbery Complete", `You stole **${money(amount)}** from ${target.displayName} and gained **${xpAmount} XP**.`, warn)] });
  }),
  simple("robstore", "Rob a store based on your interior role.", async (interaction) => {
    const member = interaction.member as GuildMember;
    const isRobber = (await hasRole(member, roleKeys.robber)) || hasDiscordRole(member, discordRoleNames.robber);
    const isHitman = (await hasRole(member, roleKeys.hitman)) || hasDiscordRole(member, discordRoleNames.hitman);
    const isCop = (await hasRole(member, roleKeys.cop)) || hasDiscordRole(member, discordRoleNames.cop);
    const isFbi = (await hasRole(member, roleKeys.fbi)) || hasDiscordRole(member, discordRoleNames.fbi);
    if (!isRobber && !isHitman) return deny(interaction, "Only Robbers and Hitmen can rob stores.");
    if (isCop || isFbi) return deny(interaction, "You cannot rob stores while you are law enforcement.");
    const cooldown = await checkCooldown("robstore", interaction.user.id, interaction.guildId || "", 3 * 60 * 1000);
    if (!cooldown.allowed) return deny(interaction, `Wait ${cooldown.secondsLeft}s before robbing another store.`);

    const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    const interior = findCurrentInterior(member, profile.current_interior);
    if (!interior) return deny(interaction, "You need to be inside one of the store interiors before robbing. Use `/enter` first.");

    const config = robberyConfig(interior.value);
    const amount = random(config.min, config.max);
    const xpAmount = config.xp;
    const robberyDelay = config.seconds * 1000;
    await markCrime(member, profile);
    await sendCopsRadioAlert(interaction, "Interior Robbery", member, interior.name, null, `${interior.name} is currently being robbed.`);
    await addGameAction({
      actorUserId: interaction.user.id,
      serverId: interaction.guildId,
      channelId: interaction.channelId,
      actionType: "store_robbery_started",
      result: interior.value,
      details: { interior: interior.name, class: isHitman ? "hitman" : "robber", seconds: config.seconds, xp: xpAmount, min: config.min, max: config.max }
    });
    await interaction.reply({
      embeds: [
        embed(
          "Robbery In Progress",
          `${interaction.user.username} has started robbing **${interior.name}**.\nThey must survive for **${config.seconds} seconds** without being dead, jailed, or cuffed.`,
          warn
        )
      ]
    });

    await sendChannelEmbeds(interaction, [
      embed(
        `${interior.name} Robbery Scene`,
        [
          "Chaos spills across the room as everyone freezes.",
          "",
          `Shop Owner: "Easy! Take the cash, just do not hurt anyone!"`,
          `Customer: "I only came here for supplies!"`,
          `${isHitman ? "Hitman" : "Robber"}: "Nobody move. Open the register and the safe. Now."`
        ].join("\n"),
        0xff8c42
      )
    ]);

    setTimeout(() => {
      void completeStoreRobbery(interaction, member, interior, amount, xpAmount);
    }, robberyDelay);
  }),
  simple("bc", "Attempt to break cuffs.", async (interaction) => {
    const member = interaction.member as GuildMember;
    if (!(await hasRole(member, roleKeys.cuffed))) return deny(interaction, "You are not cuffed.");
    if (Math.random() > 0.45) {
      await removeRoles(member, [roleKeys.cuffed]);
      await addRole(member, roleKeys.suspect);
      await interaction.reply({ embeds: [embed("Cuffs Broken", "You broke the cuffs and escaped. You are now a suspect.", warn)] });
    } else {
      await interaction.reply({ embeds: [embed("Escape Failed", "You failed to break the cuffs.", danger)] });
    }
  }),
  simple("breakcuffs", "Use a Cuff Kit to break your own cuffs.", async (interaction) => {
    const member = interaction.member as GuildMember;
    if (!(await hasRole(member, roleKeys.cuffed))) return deny(interaction, "You are not cuffed.");
    if (!(await consumeInventoryItem(interaction.user.id, interaction.guildId || "", "Cuff Kit", roleKeys.cuffKit))) return deny(interaction, "You need a Cuff Kit to break your own cuffs.");
    await removeRoles(member, [roleKeys.cuffed]);
    await addRole(member, roleKeys.suspect);
    await interaction.reply({ embeds: [embed("Cuffs Broken", "You used a Cuff Kit and broke your cuffs. You are now a suspect.", warn)] });
  }),
  targetCommand("picklockcuffs", "Use a Pin to break another player's cuffs.", "suspect", async (interaction, suspect) => {
    if (!(await hasRole(suspect, roleKeys.cuffed))) return deny(interaction, "That player is not cuffed.");
    if (!(await sameInterior(interaction.member as GuildMember, suspect))) return deny(interaction, "You must be in the same interior as the cuffed player.");
    if (!(await consumeInventoryItem(interaction.user.id, interaction.guildId || "", "Pin", roleKeys.pin))) return deny(interaction, "You need a Pin to pick another player's cuffs.");
    await removeRoles(suspect, [roleKeys.cuffed]);
    await addRole(suspect, roleKeys.suspect);
    await interaction.reply({ embeds: [embed("Cuffs Picklocked", `${suspect.displayName}'s cuffs were opened with a Pin.`, warn)] });
  }),
  new SlashCommandBuilder()
    .setName("shot")
    .setDescription("Shoot another user with a weapon from your inventory.")
    .addUserOption((option) => option.setName("target").setDescription("Target.").setRequired(true))
    .addStringOption((option) => option.setName("weapon").setDescription("Weapon name.").setRequired(true))
    .toCommand(async (interaction) => {
      const target = interaction.options.getMember("target") as GuildMember;
      const weaponName = interaction.options.getString("weapon", true);
      const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
      const weapon = getInventory(profile).find((item) => item.name.toLowerCase() === weaponName.toLowerCase() && item.type === "weapon" && isActiveWeapon(item.name));
      if (!weapon) return deny(interaction, "You do not have that weapon in your inventory.");
      await attack(interaction, target, weapon.name, weapon.damage || 10);
    }),
  simple("respawn", "Respawn after death.", async (interaction) => {
    const member = interaction.member as GuildMember;
    const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    await applyHealthCap(member, profile);
    profile.health = profile.max_health;
    profile.is_dead = false;
    await saveGameProfile(profile);
    await removeRoles(member, [roleKeys.dead]);
    await interaction.reply({ embeds: [embed("Respawned", "You have recovered and returned to active play.", ok)] });
  }),
  simple("myhealth", "Check your current health and armor.", async (interaction) => {
    const member = interaction.member as GuildMember;
    const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    await applyHealthCap(member, profile);
    await interaction.reply({ embeds: [embed("Health", `Health: **${profile.health}/${profile.max_health}**\nArmor: **${profile.armor}**`, info)], ephemeral: true });
  }),
  simple("buyarmor", "Buy armor for 10,000 currency.", async (interaction) => buyHealthOrArmor(interaction, "armor")),
  simple("buyhealth", "Buy a health boost for 10,000 currency.", async (interaction) => buyHealthOrArmor(interaction, "health")),
  moderationCaseCommand("cwarn", "Warn a player for game-related violations.", "game_warn", "game", "warn"),
  moderationCaseCommand("cmute", "Mute a player from CNR gameplay.", "game_mute", "game", "mute"),
  moderationCaseCommand("ckick", "Kick a player from the active CNR game.", "game_kick", "game", "kick"),
  moderationCaseCommand("cban", "Ban a player from CNR gameplay.", "game_ban", "game", "ban"),
  moderationLogsCommand("calogs", "Review game moderation history.", "game"),
  moderationCaseCommand("warn", "Warn a member for server rule violations.", "server_warn", "server", "warn"),
  moderationCaseCommand("mute", "Mute a member for server rule violations.", "server_mute", "server", "mute"),
  moderationCaseCommand("kick", "Kick a member from the server.", "server_kick", "server", "kick"),
  moderationCaseCommand("ban", "Ban a member from the server.", "server_ban", "server", "ban"),
  moderationLogsCommand("alogs", "Review server moderation history.", "server"),
  moderationCommand("cunban", "Unban a user in CNR channels.", "unban", roleKeys.cnrBanned, true),
  moderationCommand("cunmute", "Unmute a user in CNR channels.", "unmute", roleKeys.cnrMuted, true),
  moderationCommand("csuspend", "Suspend a user in CNR channels.", "suspend", roleKeys.cnrSuspended),
  moderationCommand("cunsuspend", "Unsuspend a user in CNR channels.", "unsuspend", roleKeys.cnrSuspended, true),
  toggleRoleCommand("moderatorduty", "Toggle Moderator duty status.", roleKeys.moderatorDuty),
  toggleRoleCommand("supervisorduty", "Toggle Supervisor duty status.", roleKeys.supervisorDuty),
  toggleRoleCommand("anhemode", "Toggle Anhemode role.", roleKeys.anhemode),
  toggleRoleCommand("aprelmode", "Toggle Aprelmode role.", roleKeys.aprelmode),
  ticketCommand(),
  new SlashCommandBuilder()
    .setName("assignticket")
    .setDescription("Assign a ticket to a staff member.")
    .addStringOption((option) => option.setName("ticket_id").setDescription("Ticket ID.").setRequired(true))
    .addUserOption((option) => option.setName("staff").setDescription("Staff member.").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .toCommand(async (interaction) => {
      const ticketId = interaction.options.getString("ticket_id", true);
      const staff = interaction.options.getUser("staff", true);
      await updateTicket(ticketId, { assigned_user_id: staff.id, status: "assigned" });
      await interaction.reply({ embeds: [embed("Ticket Assigned", `Ticket **${ticketId}** assigned to <@${staff.id}>.`, ok)] });
    }),
  simple("closeticket", "Close the current ticket.", async (interaction) => {
    await updateTicket(interaction.channelId, { status: "closed", closed_at: new Date().toISOString() });
    await interaction.reply({ embeds: [embed("Ticket Closed", "This ticket has been marked closed.", warn)] });
  }),
  simple("reopenticket", "Reopen the current ticket.", async (interaction) => {
    await updateTicket(interaction.channelId, { status: "open", closed_at: "" });
    await interaction.reply({ embeds: [embed("Ticket Reopened", "This ticket is open again.", ok)] });
  }),
  simple("setupticket", "Show ticket setup guidance.", async (interaction) => {
    await interaction.reply({ embeds: [embed("Ticket Setup", "Use `/ticket create category:support` to create tracked Appwrite tickets. Admins can assign, close, and reopen tickets.", info)], ephemeral: true });
  }),
  giveawayCommand(),
  new SlashCommandBuilder()
    .setName("giveawayreroll")
    .setDescription("Reroll a giveaway winner.")
    .addStringOption((option) => option.setName("message_id").setDescription("Giveaway message ID.").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toCommand(async (interaction) => {
      await updateGiveaway(interaction.options.getString("message_id", true), { status: "rerolled" });
      await interaction.reply({ embeds: [embed("Giveaway Rerolled", "Giveaway was marked for reroll. Pick the new winner from message reactions.", ok)], ephemeral: true });
    }),
  new SlashCommandBuilder()
    .setName("giveawaystop")
    .setDescription("Stop an ongoing giveaway.")
    .addStringOption((option) => option.setName("message_id").setDescription("Giveaway message ID.").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toCommand(async (interaction) => {
      await updateGiveaway(interaction.options.getString("message_id", true), { status: "stopped" });
      await interaction.reply({ embeds: [embed("Giveaway Stopped", "Giveaway was stopped and logged.", warn)] });
    }),
  musicCommand()
];

export const commandMap = new Map(commands.map((command) => [command.data.name, command]));

async function showAbout(interaction: ChatInputCommandInteraction) {
  const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
  const inventory = getInventory(profile);
  await interaction.reply({
    embeds: [
      embed("About Me", `<@${interaction.user.id}>`, info).addFields(
        { name: "Currency", value: money(profile.currency), inline: true },
        { name: "Level", value: String(profile.level), inline: true },
        { name: "XP", value: String(profile.experience), inline: true },
        { name: "Health", value: `${profile.health}/${profile.max_health}`, inline: true },
        { name: "Armor", value: String(profile.armor), inline: true },
        { name: "Interior", value: profile.current_interior || "None", inline: true },
        { name: "Inventory", value: inventory.length ? inventory.map((item) => item.name).slice(0, 20).join(", ") : "Empty", inline: false }
      )
    ],
    ephemeral: true
  });
}

async function attack(interaction: ChatInputCommandInteraction, target: GuildMember, weaponName: string, damage: number) {
  const targetProfile = await getOrCreateGameProfile(target.id, interaction.guildId || "");
  const armorDamage = Math.min(targetProfile.armor, damage);
  const healthDamage = damage - armorDamage;
  targetProfile.armor -= armorDamage;
  targetProfile.health -= healthDamage;
  if (targetProfile.health <= 0) {
    targetProfile.health = 0;
    targetProfile.is_dead = true;
    await addRole(target, roleKeys.dead);
    await saveGameProfile(targetProfile);
    await applyInventoryLossForJailOrDeath(target, "death");
  } else {
    await saveGameProfile(targetProfile);
  }
  const attacker = interaction.member as GuildMember;
  const lawReward = targetProfile.is_dead ? await rewardLawCapture(attacker, target, "kill", interaction.guildId || "") : null;
  if (targetProfile.is_dead && lawReward) {
    await removeRoles(target, [roleKeys.suspect, roleKeys.mostWanted]);
    await removeCrimeDiscordRoles(target);
  } else {
    const attackerProfile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
    await markCrime(attacker, attackerProfile);
    await sendCopsRadioAlert(
      interaction,
      targetProfile.is_dead ? "Murder" : "Attempted Murder",
      attacker,
      currentLocation(attacker, attackerProfile.current_interior),
      target,
      `${target.displayName} was ${targetProfile.is_dead ? "killed" : "shot"} with ${weaponName}.`
    );
  }
  await addGameAction({
    actorUserId: interaction.user.id,
    targetUserId: target.id,
    serverId: interaction.guildId,
    channelId: interaction.channelId,
    actionType: "attack",
    result: targetProfile.is_dead ? "dead" : "wounded",
    details: { weaponName, damage, armorDamage, healthDamage }
  });
  await interaction.reply({
    embeds: [
      embed("Attack Result", `**${weaponName}** dealt **${damage}** damage to ${target.displayName}.`, targetProfile.is_dead ? danger : warn).addFields(
        { name: "Target Health", value: String(targetProfile.health), inline: true },
        { name: "Target Armor", value: String(targetProfile.armor), inline: true },
        { name: "Status", value: targetProfile.is_dead ? "Dead" : "Wounded", inline: true },
        ...(lawReward ? [{ name: "Law Reward", value: `${money(lawReward.money)} and ${lawReward.xp} XP`, inline: false }] : [])
      )
    ]
  });
}

async function buyHealthOrArmor(interaction: ChatInputCommandInteraction, type: "health" | "armor") {
  const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
  const price = type === "armor" ? 7500 : 10000;
  if (profile.currency < price) return deny(interaction, `You need ${money(price)}.`);
  profile.currency -= price;
  profile.total_spent += price;
  if (type === "armor") profile.armor = Math.min(100, profile.armor + 100);
  if (type === "health") profile.health = Math.min(profile.max_health, profile.health + 100);
  await saveGameProfile(profile);
  await addTransaction({ discordUserId: interaction.user.id, serverId: interaction.guildId, type: `buy_${type}`, amount: -price, balanceAfter: profile.currency });
  await interaction.reply({ embeds: [embed(type === "armor" ? "Armor Purchased" : "Health Purchased", `Updated health/armor. Balance: **${money(profile.currency)}**.`, ok)] });
}

async function buyWeapon(member: GuildMember, userId: string, guildId: string, id: number) {
  const weapon = weapons[id as keyof typeof weapons];
  if (!weapon) return { embed: embed("Invalid Weapon", "That weapon is not configured anymore.", danger) };
  const profile = await getOrCreateGameProfile(userId, guildId);
  if (profile.currency < weapon.price) {
    return { embed: embed("Not Enough Money", `You need ${money(weapon.price)} to buy **${weapon.name}**.`, danger) };
  }
  profile.currency -= weapon.price;
  profile.total_spent += weapon.price;
  const inventory = getInventory(profile);
  inventory.push({ name: weapon.name, type: "weapon", damage: weapon.damage, price: weapon.price });
  setInventory(profile, inventory);
  await saveGameProfile(profile);
  await addRole(member, weapon.roleKey);
  await addTransaction({ discordUserId: userId, serverId: guildId, type: "weapon_purchase", amount: -weapon.price, balanceAfter: profile.currency, details: weapon });
  return { embed: embed("Weapon Purchased", `You bought **${weapon.name}**.\nDamage: **${weapon.damage}**\nBalance: **${money(profile.currency)}**.`, ok) };
}

async function buyShopItem(member: GuildMember, userId: string, guildId: string, itemKey: keyof typeof shopItems, item: (typeof shopItems)[keyof typeof shopItems]) {
  const profile = await getOrCreateGameProfile(userId, guildId);
  if (profile.currency < item.price) {
    return { embed: embed("Not Enough Money", `You need ${money(item.price)} to buy **${item.name}**.`, danger) };
  }
  profile.currency -= item.price;
  profile.total_spent += item.price;
  const inventory = getInventory(profile);
  inventory.push({ name: item.name, type: "item", price: item.price });
  setInventory(profile, inventory);
  await saveGameProfile(profile);
  await addRole(member, item.roleKey);
  await addTransaction({ discordUserId: userId, serverId: guildId, type: "item_purchase", amount: -item.price, balanceAfter: profile.currency, details: { itemKey, ...item } });
  return { embed: embed("Item Purchased", `You bought **${item.name}**.\nBalance: **${money(profile.currency)}**.`, ok) };
}

async function buyArmor(_member: GuildMember, userId: string, guildId: string) {
  const profile = await getOrCreateGameProfile(userId, guildId);
  const price = 7500;
  if (profile.currency < price) {
    return { embed: embed("Not Enough Money", `You need ${money(price)} to buy **Armour**.`, danger) };
  }
  profile.currency -= price;
  profile.total_spent += price;
  profile.armor = 100;
  await saveGameProfile(profile);
  await addTransaction({ discordUserId: userId, serverId: guildId, type: "armor_purchase", amount: -price, balanceAfter: profile.currency });
  return { embed: embed("Armour Purchased", `Your armour is now **${profile.armor}/100**.\nBalance: **${money(profile.currency)}**.`, ok) };
}

async function consumeInventoryItem(userId: string, guildId: string, itemName: string, roleKey: string) {
  const profile = await getOrCreateGameProfile(userId, guildId);
  const inventory = getInventory(profile);
  const index = inventory.findIndex((item) => item.name.toLowerCase() === itemName.toLowerCase());
  if (index === -1) return false;
  inventory.splice(index, 1);
  setInventory(profile, inventory);
  await saveGameProfile(profile);
  if (!inventory.some((item) => item.name.toLowerCase() === itemName.toLowerCase())) {
    await revokeVirtualRole(userId, guildId, roleKey);
  }
  return true;
}

function moderationCaseCommand(
  name: string,
  description: string,
  caseType: string,
  scope: "game" | "server",
  action: "warn" | "mute" | "kick" | "ban"
): CommandDefinition {
  const builder = new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addUserOption((option) => option.setName("user").setDescription("Target user.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason.").setRequired(true).setMaxLength(900));
  if (action === "mute" || action === "ban") {
    builder.addStringOption((option) => option.setName("duration").setDescription("Duration, e.g. 1h, 12h, 1d, 7d.").setRequired(action === "mute"));
  }
  return builder.toCommand(async (interaction) => {
    const moderator = interaction.member as GuildMember;
    const requiredChannelId = scope === "game" ? gameModerationChannelId : serverModerationChannelId;
    if (interaction.channelId !== requiredChannelId) {
      return deny(interaction, `Use this command in <#${requiredChannelId}>.`);
    }
    if (!canUseModerationAction(moderator, scope, action)) {
      return deny(interaction, moderationAccessMessage(scope, action));
    }

    const targetUser = interaction.options.getUser("user", true);
    const targetMember = interaction.guild ? await interaction.guild.members.fetch(targetUser.id).catch(() => null) : null;
    const reason = interaction.options.getString("reason", true);
    const durationText = interaction.options.getString("duration");
    const durationMs = durationText ? parseDuration(durationText) : null;
    if (durationText && !durationMs) return deny(interaction, "Invalid duration. Use values like `1h`, `12h`, `1d`, or `7d`.");
    const expiresAt = durationMs ? new Date(Date.now() + durationMs).toISOString() : "";
    await notifyPunishedUser(targetUser, {
      scope,
      action,
      reason,
      moderatorId: interaction.user.id,
      serverName: interaction.guild?.name || "CNR - Discord AI Hub",
      duration: durationText || ""
    });

    if (scope === "game") {
      if (!targetMember) return deny(interaction, "Target member is not in this server.");
      await applyGameModerationAction(targetMember, action, durationMs || 0);
    } else {
      await applyServerModerationAction(interaction, targetUser.id, targetMember, action, reason, durationMs || 0);
    }

    await createModerationCase({
      caseType,
      serverId: interaction.guildId,
      moderatorUserId: interaction.user.id,
      targetUserId: targetUser.id,
      reason,
      status: action === "warn" || action === "kick" ? "logged" : "active",
      expiresAt
    });
    await sendModerationAudit(interaction, { targetUserId: targetUser.id, moderatorUserId: interaction.user.id, reason, caseType, scope, action, expiresAt });
    await interaction.reply({
      embeds: [
        embed(`${scope === "game" ? "Game" : "Server"} ${titleCase(action)}`, `<@${targetUser.id}>\nReason: **${reason}**${durationText ? `\nDuration: **${durationText}**` : ""}`, action === "warn" ? warn : danger)
      ]
    });
  });
}

function moderationLogsCommand(name: string, description: string, scope: "game" | "server"): CommandDefinition {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addUserOption((option) => option.setName("user").setDescription("Target user.").setRequired(true))
    .toCommand(async (interaction) => {
      const moderator = interaction.member as GuildMember;
      const requiredChannelId = scope === "game" ? gameModerationChannelId : serverModerationChannelId;
      if (interaction.channelId !== requiredChannelId) return deny(interaction, `Use this command in <#${requiredChannelId}>.`);
      if (!canUseModerationLogs(moderator, scope)) return deny(interaction, "You do not have access to these moderation logs.");
      const target = interaction.options.getUser("user", true);
      const prefix = scope === "game" ? "game_" : "server_";
      const cases = await listModerationCases({
        serverId: interaction.guildId,
        targetUserId: target.id,
        caseTypes: [`${prefix}warn`, `${prefix}mute`, `${prefix}kick`, `${prefix}ban`],
        limit: 10
      });
      await interaction.reply({
        embeds: [
          embed(`${scope === "game" ? "Game" : "Server"} Moderation Logs`, `<@${target.id}>`, info)
            .addFields({
              name: cases.length ? "Recent Cases" : "Recent Cases",
              value: cases.length
                ? cases.map((item) => `**${item.case_type.replace(`${prefix}`, "")}** by <@${item.moderator_user_id}> - ${item.reason || "No reason"} <t:${Math.floor(new Date(item.created_at).getTime() / 1000)}:R>`).join("\n").slice(0, 1000)
                : "No moderation history found.",
              inline: false
            })
            .setThumbnail(target.displayAvatarURL())
        ]
      });
    });
}

async function applyGameModerationAction(member: GuildMember, action: "warn" | "mute" | "kick" | "ban", durationMs: number) {
  if (action === "mute") {
    const removedClassRoleIds = getClassDiscordRoleIds(member);
    await member.roles.add(moderationRoleIds.cnrMuted, "CNR game moderation mute.").catch(() => null);
    await removeClassDiscordRoles(member);
    await removeRoles(member, [...Object.values(gameModes)]);
    await addRole(member, roleKeys.cnrMuted);
    if (durationMs) {
      setTimeout(() => {
        void restoreAfterCnrMute(member, removedClassRoleIds);
      }, Math.min(durationMs, 2_147_483_647));
    }
  }
  if (action === "ban") {
    await member.roles.add(moderationRoleIds.cnrBanned, "CNR game moderation ban.").catch(() => null);
    await addRole(member, roleKeys.cnrBanned);
    if (durationMs) setTimeout(() => void member.roles.remove(moderationRoleIds.cnrBanned, "CNR game ban expired.").catch(() => null), Math.min(durationMs, 2_147_483_647));
  }
  if (action === "kick") {
    await removeDiscordRole(member, discordRoleNames.online);
    await removeClassDiscordRoles(member);
    await removeInteriorDiscordRoles(member);
    await removeRoles(member, [...Object.values(gameModes)]);
    const profile = await getOrCreateGameProfile(member.id, member.guild.id);
    profile.active_mode = "";
    profile.current_interior = "";
    await saveGameProfile(profile);
  }
}

async function applyServerModerationAction(
  interaction: ChatInputCommandInteraction,
  targetUserId: string,
  targetMember: GuildMember | null,
  action: "warn" | "mute" | "kick" | "ban",
  reason: string,
  durationMs: number
) {
  if (action === "mute" && targetMember) {
    await targetMember.timeout(Math.min(durationMs || 60 * 60 * 1000, 28 * 24 * 60 * 60 * 1000), reason).catch(() => null);
  }
  if (action === "kick" && targetMember) {
    await targetMember.kick(reason).catch(() => null);
  }
  if (action === "ban" && interaction.guild) {
    await interaction.guild.members.ban(targetUserId, { reason }).catch(() => null);
  }
}

async function restoreAfterCnrMute(originalMember: GuildMember, removedClassRoleIds: string[]) {
  const member = await originalMember.guild.members.fetch(originalMember.id).catch(() => null);
  if (!member) return;
  await member.roles.remove(moderationRoleIds.cnrMuted, "CNR game mute expired.").catch(() => null);
  await removeRoles(member, [roleKeys.cnrMuted]);
  if (!member.roles.cache.has(discordRoleIds.online)) return;
  const restorableRoleIds = removedClassRoleIds.filter((roleId) => member.guild.roles.cache.has(roleId));
  if (restorableRoleIds.length) {
    await member.roles.add(restorableRoleIds, "CNR game mute expired: restored previous class.").catch(() => null);
    await restoreVirtualClassRole(member, restorableRoleIds[0]);
  }
}

async function sendModerationAudit(
  interaction: ChatInputCommandInteraction,
  input: {
    targetUserId: string;
    moderatorUserId: string;
    reason: string;
    caseType: string;
    scope: "game" | "server";
    action: string;
    expiresAt: string;
  }
) {
  const channel = interaction.guild ? await interaction.guild.channels.fetch(punishmentLogsChannelId).catch(() => null) : null;
  if (!channel || channel.type !== ChannelType.GuildText) return;
  const target = await interaction.client.users.fetch(input.targetUserId).catch(() => null);
  const auditEmbed = embed(`${input.scope === "game" ? "Game" : "Server"} ${titleCase(input.action)}`, `<@${input.targetUserId}>`, input.action === "warn" ? warn : danger)
    .addFields(
      { name: "User ID", value: input.targetUserId, inline: true },
      { name: "Moderator", value: `<@${input.moderatorUserId}>`, inline: true },
      { name: "Type", value: input.caseType, inline: true },
      { name: "Reason", value: input.reason, inline: false }
    )
    .setThumbnail(target?.displayAvatarURL() || null);
  if (input.expiresAt) auditEmbed.addFields({ name: "Expires", value: `<t:${Math.floor(new Date(input.expiresAt).getTime() / 1000)}:R>`, inline: true });
  await channel.send({ embeds: [auditEmbed] });
}

async function notifyPunishedUser(
  user: { send: (options: { embeds: EmbedBuilder[] }) => Promise<unknown>; id: string },
  input: { scope: "game" | "server"; action: string; reason: string; moderatorId: string; serverName: string; duration: string }
) {
  await user
    .send({
      embeds: [
        embed(
          `${input.scope === "game" ? "Game" : "Server"} ${titleCase(input.action)}`,
          [
            `Server: **${input.serverName}**`,
            `Action: **${titleCase(input.action)}**`,
            input.duration ? `Duration: **${input.duration}**` : "",
            `Reason: **${input.reason}**`,
            `Moderator: <@${input.moderatorId}>`
          ]
            .filter(Boolean)
            .join("\n"),
          input.action === "warn" ? warn : danger
        )
      ]
    })
    .catch(() => null);
}

function moderationCommand(name: string, description: string, caseType: string, roleKey: string | null, remove = false): CommandDefinition {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addUserOption((option) => option.setName("user").setDescription("Target user.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason.").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .toCommand(async (interaction) => {
      const target = interaction.options.getMember("user") as GuildMember;
      const reason = interaction.options.getString("reason") || "No reason provided";
      if (roleKey) {
        if (remove) await removeRoles(target, [roleKey]);
        else await addRole(target, roleKey);
      }
      await createModerationCase({
        caseType,
        serverId: interaction.guildId,
        moderatorUserId: interaction.user.id,
        targetUserId: target.id,
        reason,
        status: remove ? "resolved" : "active"
      });
      await interaction.reply({ embeds: [embed("Moderation Case", `${description}\nTarget: ${target}\nReason: ${reason}`, remove ? ok : warn)] });
    });
}

function toggleRoleCommand(name: string, description: string, roleKey: string): CommandDefinition {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .toCommand(async (interaction) => {
      const member = interaction.member as GuildMember;
      if (await hasRole(member, roleKey)) {
        await removeRoles(member, [roleKey]);
        await interaction.reply({ embeds: [embed("Role Removed", `${description} removed.`, warn)], ephemeral: true });
      } else {
        await addRole(member, roleKey);
        await interaction.reply({ embeds: [embed("Role Added", `${description} enabled.`, ok)], ephemeral: true });
      }
    });
}

function ticketCommand(): CommandDefinition {
  return new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket tools.")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a support ticket.")
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Ticket category.")
            .setRequired(false)
            .addChoices(
              { name: "Support", value: "support" },
              { name: "Suggestion", value: "suggestion" },
              { name: "Bug Report", value: "bug_report" },
              { name: "User Report", value: "user_report" },
              { name: "Moderator Application", value: "moderator_application" },
              { name: "FBI Application", value: "fbi_application" },
              { name: "Hitman Application", value: "hitman_application" },
              { name: "Other", value: "other" }
            )
        )
    )
    .addSubcommand((sub) => sub.setName("status").setDescription("Show this ticket status."))
    .toCommand(async (interaction) => {
      const sub = interaction.options.getSubcommand();
      if (sub === "create") {
        const category = interaction.options.getString("category") || "support";
        const channelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 90);
        let channelId = interaction.channelId;
        if (interaction.guild) {
          const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            reason: `Ticket created by ${interaction.user.tag}`
          });
          channelId = channel.id;
          await (channel as TextChannel).send({ content: `<@${interaction.user.id}> ticket created for **${category}**.` });
        }
        await createTicket({ ticketId: channelId, serverId: interaction.guildId, channelId, creatorUserId: interaction.user.id, category });
        await interaction.reply({ embeds: [embed("Ticket Created", `Ticket ID: **${channelId}**`, ok)], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed("Ticket Status", `Current channel ticket ID: **${interaction.channelId}**`, info)], ephemeral: true });
      }
    });
}

function giveawayCommand(): CommandDefinition {
  return new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Start a giveaway.")
    .addStringOption((option) => option.setName("duration").setDescription("Duration, e.g. 10m, 1h, 1d.").setRequired(true))
    .addStringOption((option) => option.setName("prize").setDescription("Prize.").setRequired(true).setMaxLength(200))
    .addIntegerOption((option) => option.setName("winners").setDescription("Number of winners.").setRequired(true).setMinValue(1).setMaxValue(20))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toCommand(async (interaction) => {
      const duration = interaction.options.getString("duration", true);
      const ms = parseDuration(duration);
      if (!ms) return deny(interaction, "Use a valid duration like 10m, 1h, or 1d.");
      const prize = interaction.options.getString("prize", true);
      const winners = interaction.options.getInteger("winners", true);
      const giveawayEmbed = embed("Giveaway Started", `Prize: **${prize}**\nWinners: **${winners}**\nReact with 🎉 to enter.\nEnds: <t:${Math.floor((Date.now() + ms) / 1000)}:R>`, warn);
      const channel = interaction.channel as TextChannel | null;
      const message = await channel?.send({ embeds: [giveawayEmbed] });
      if (message) {
        await message.react("🎉");
        await createGiveaway({
          messageId: message.id,
          serverId: interaction.guildId,
          channelId: interaction.channelId,
          hostUserId: interaction.user.id,
          prize,
          winnerCount: winners,
          endsAt: new Date(Date.now() + ms).toISOString()
        });
      }
      await interaction.reply({ content: `Giveaway created for **${prize}**.`, ephemeral: true });
    });
}

function musicCommand(): CommandDefinition {
  return new SlashCommandBuilder()
    .setName("music")
    .setDescription("Music controls.")
    .addSubcommand((sub) => sub.setName("play").setDescription("Queue a track URL.").addStringOption((option) => option.setName("url").setDescription("Track URL.").setRequired(true)))
    .addSubcommand((sub) => sub.setName("pause").setDescription("Pause playback."))
    .addSubcommand((sub) => sub.setName("resume").setDescription("Resume playback."))
    .addSubcommand((sub) => sub.setName("queue").setDescription("Show queue."))
    .addSubcommand((sub) => sub.setName("skip").setDescription("Skip track."))
    .addSubcommand((sub) => sub.setName("stop").setDescription("Stop playback."))
    .addSubcommand((sub) => sub.setName("volume").setDescription("Set volume.").addIntegerOption((option) => option.setName("level").setDescription("Volume 1-100.").setRequired(true).setMinValue(1).setMaxValue(100)))
    .toCommand(async (interaction) => {
      const sub = interaction.options.getSubcommand();
      await addGameAction({ actorUserId: interaction.user.id, serverId: interaction.guildId, channelId: interaction.channelId, actionType: `music_${sub}` });
      await interaction.reply({
        embeds: [
          embed(
            "Music Command Logged",
            "The old music commands are registered and tracked. Voice playback needs a Lavalink/voice adapter before real audio can play.",
            info
          )
        ],
        ephemeral: true
      });
  });
}

export async function handleInteriorButton(interaction: ButtonInteraction) {
  if (interaction.customId === "cnr_button_robstore") {
    await interaction.reply({ content: "Use `/robstore` to start the store robbery from this interior.", flags: MessageFlags.Ephemeral });
    return true;
  }

  if (interaction.customId === "cnr_buy_armor") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guild) {
      await interaction.editReply({ content: "This button only works inside the server." });
      return true;
    }
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const result = await buyArmor(member, interaction.user.id, interaction.guildId || "");
    await interaction.editReply({ embeds: [result.embed] });
    return true;
  }

  if (interaction.customId.startsWith("cnr_buy_weapon_")) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guild) {
      await interaction.editReply({ content: "This button only works inside the server." });
      return true;
    }
    const id = Number(interaction.customId.replace("cnr_buy_weapon_", ""));
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const result = await buyWeapon(member, interaction.user.id, interaction.guildId || "", id);
    await interaction.editReply({ embeds: [result.embed] });
    return true;
  }

  if (interaction.customId.startsWith("cnr_buy_item_")) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guild) {
      await interaction.editReply({ content: "This button only works inside the server." });
      return true;
    }
    const itemKey = interaction.customId.replace("cnr_buy_item_", "") as keyof typeof shopItems;
    const item = shopItems[itemKey];
    if (!item) {
      await interaction.editReply({ content: "That item is not configured anymore." });
      return true;
    }
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const result = await buyShopItem(member, interaction.user.id, interaction.guildId || "", itemKey, item);
    await interaction.editReply({ embeds: [result.embed] });
    return true;
  }

  if (!interaction.customId.startsWith("cnr_interior_")) return false;
  if (!interaction.guild) {
    await interaction.reply({ content: "Interior buttons only work inside the server.", flags: MessageFlags.Ephemeral });
    return true;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const value = interaction.customId.replace("cnr_interior_", "");
  const selected = interiors.find((interior) => interior.value === value);
  if (!selected) {
    await interaction.editReply({ content: "That interior is not configured anymore." });
    return true;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  if ((await hasRole(member, roleKeys.jailed)) || (await hasRole(member, roleKeys.dead))) {
    await interaction.editReply({ content: "You cannot enter while jailed or dead." });
    return true;
  }

  const result = await enterInterior(member, interaction.user.id, interaction.guildId || "", selected);
  await sendInteriorPublicMessages(interaction, member, result.enteredInterior);
  await interaction.editReply({ embeds: [result.embed] });
  return true;
}

export async function syncMemberHealthCap(member: GuildMember) {
  const profile = await getOrCreateGameProfile(member.id, member.guild.id);
  await applyHealthCap(member, profile);
  const loggedIn = member.roles.cache.has(discordRoleIds.online);
  if (profile.active_mode && loggedIn) {
    if (profile.current_interior) await removeOutsideRole(member);
    else await addOutsideRole(member);
    await restoreInventoryRoles(member, profile);
    await restoreSuspendedCrimeStatus(member, profile);
  } else if (!loggedIn) {
    await removeOutsideRole(member);
  }
}

async function completeStoreRobbery(
  interaction: ChatInputCommandInteraction,
  member: GuildMember,
  interior: (typeof interiors)[number],
  amount: number,
  xpAmount: number
) {
  const profile = await getOrCreateGameProfile(interaction.user.id, interaction.guildId || "");
  if (await isRobberyInterrupted(member)) {
    await addGameAction({
      actorUserId: interaction.user.id,
      serverId: interaction.guildId,
      channelId: interaction.channelId,
      actionType: "store_robbery_failed",
      result: "interrupted",
      details: { interior: interior.name }
    });
    await sendChannelEmbeds(interaction, [embed("Robbery Failed", `${interaction.user.username} failed the robbery at **${interior.name}** because they were dead, jailed, or cuffed.`, danger)]);
    return;
  }

  profile.currency += amount;
  profile.robbed_money += amount;
  profile.total_earned += amount;
  profile.score += 5;
  addExperience(profile, xpAmount);
  await saveGameProfile(profile);
  await addTransaction({
    discordUserId: interaction.user.id,
    serverId: interaction.guildId,
    type: "store_robbery",
    amount,
    balanceAfter: profile.currency,
    details: { interior: interior.name, xp: xpAmount }
  });
  await addGameAction({
    actorUserId: interaction.user.id,
    serverId: interaction.guildId,
    channelId: interaction.channelId,
    actionType: "store_robbery_completed",
    result: "success",
    details: { interior: interior.name, amount, xp: xpAmount }
  });

  await sendChannelEmbeds(interaction, [
    embed("Robbery Successful", `${interaction.user.username} escaped the counter at **${interior.name}** with the cash.`, ok).addFields(
      { name: "Money Stolen", value: money(amount), inline: true },
      { name: "XP Gained", value: `${xpAmount} XP`, inline: true }
    )
  ]);

  await sendChannelEmbeds(interaction, [
    embed(
      "Cops Arrive",
      [
        `The alarm has alerted the cops outside **${interior.name}**.`,
        "",
        `Cop 1: "This is the police. The building is surrounded."`,
        `Cop 2: "Every exit is covered. Come out with your hands up."`,
        `Robber: "Back up! I am not walking out empty-handed."`
      ].join("\n"),
      info
    )
  ]);
}

function targetCommand(
  name: string,
  description: string,
  optionName: string,
  handler: (interaction: ChatInputCommandInteraction, target: GuildMember) => Promise<void>
): CommandDefinition {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addUserOption((option) => option.setName(optionName).setDescription("Target member.").setRequired(true))
    .toCommand(async (interaction) => {
      const target = interaction.options.getMember(optionName) as GuildMember | null;
      if (!target) {
        await interaction.reply({ content: "Target member not found.", ephemeral: true });
        return;
      }
      await handler(interaction, target);
    });
}

function simple(name: string, description: string, execute: (interaction: ChatInputCommandInteraction) => Promise<void>): CommandDefinition {
  return new SlashCommandBuilder().setName(name).setDescription(description).toCommand(execute);
}

function embed(title: string, description: string, color = info) {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(color).setTimestamp();
}

async function sendChannelEmbeds(interaction: ChatInputCommandInteraction | ButtonInteraction, embeds: EmbedBuilder[], components: ActionRowBuilder<ButtonBuilder>[] = []) {
  if (!interaction.channel || !("send" in interaction.channel)) return;
  await (interaction.channel as TextChannel).send({ embeds, components });
}

async function sendCopsRadioAlert(
  interaction: ChatInputCommandInteraction,
  crime: string,
  actor: GuildMember,
  location: string,
  target: GuildMember | null,
  details: string
) {
  if (!interaction.guild) return;
  await interaction.guild.roles.fetch().catch(() => null);
  const copRole = interaction.guild.roles.cache.find((role) => role.name.toLowerCase() === discordRoleNames.cop.toLowerCase());
  const fbiRole = interaction.guild.roles.cache.find((role) => role.name.toLowerCase() === discordRoleNames.fbi.toLowerCase());
  const roleIds = [copRole?.id, fbiRole?.id].filter((roleId): roleId is string => Boolean(roleId));
  const channel = await interaction.guild.channels.fetch(copsRadioChannelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const alert = embed("Cops Radio Alert", details, danger).addFields(
    { name: "Incident", value: `**${crime}**`, inline: true },
    { name: "Location", value: `**${location}**`, inline: true },
    { name: "Suspect", value: `<@${actor.id}>`, inline: true }
  );
  if (target) alert.addFields({ name: "Target", value: `<@${target.id}>`, inline: true });

  await channel.send({
    content: roleIds.map((roleId) => `<@&${roleId}>`).join(" ") || "Law enforcement alert",
    embeds: [alert],
    allowedMentions: { roles: roleIds }
  });
}

function currentLocation(member: GuildMember, currentInterior: string) {
  if (currentInterior) return interiors.find((interior) => interior.value === currentInterior)?.name || titleCase(currentInterior.replace(/_/g, " "));
  return member.roles.cache.has(discordRoleIds.outside) ? "Outside" : "Outside";
}

async function deny(interaction: ChatInputCommandInteraction, message: string) {
  await interaction.reply({ embeds: [embed("Not Allowed", message, danger)], ephemeral: true });
}

async function addRole(member: GuildMember, roleKey: string) {
  await grantVirtualRole(member.id, member.guild.id, roleKey);
}

async function removeRoles(member: GuildMember, roleKeysToRemove: string[]) {
  for (const roleKey of roleKeysToRemove) {
    await revokeVirtualRole(member.id, member.guild.id, roleKey);
  }
}

async function hasRole(member: GuildMember, roleKey: string) {
  return hasVirtualRole(member.id, member.guild.id, roleKey);
}

async function markCrime(member: GuildMember, profile: Awaited<ReturnType<typeof getOrCreateGameProfile>>) {
  const stats = getStats(profile);
  stats.crime_count = Number(stats.crime_count || 0) + 1;
  await addRole(member, roleKeys.suspect);
  await addCrimeDiscordRole(member, "suspect");
  if (stats.crime_count >= 2) {
    await addRole(member, roleKeys.mostWanted);
    await addCrimeDiscordRole(member, "mostWanted");
  }
  setStats(profile, stats);
  await saveGameProfile(profile);
}

async function restoreSuspendedCrimeStatus(member: GuildMember, profile: Awaited<ReturnType<typeof getOrCreateGameProfile>>) {
  const criminalClass = profile.active_mode === "robber" || profile.active_mode === "hitman" || hasDiscordRole(member, discordRoleNames.robber) || hasDiscordRole(member, discordRoleNames.hitman);
  const stats = getStats(profile);
  if (!criminalClass) {
    stats.suspended_suspect = 0;
    stats.suspended_most_wanted = 0;
    setStats(profile, stats);
    await saveGameProfile(profile);
    return;
  }

  if (stats.suspended_suspect) {
    await addRole(member, roleKeys.suspect);
    await addCrimeDiscordRole(member, "suspect");
  }
  if (stats.suspended_most_wanted) {
    await addRole(member, roleKeys.mostWanted);
    await addCrimeDiscordRole(member, "mostWanted");
  }
  stats.suspended_suspect = 0;
  stats.suspended_most_wanted = 0;
  setStats(profile, stats);
  await saveGameProfile(profile);
}

async function restoreInventoryRoles(member: GuildMember, profile: Awaited<ReturnType<typeof getOrCreateGameProfile>>) {
  for (const item of getInventory(profile)) {
    const weapon = Object.values(weapons).find((candidate) => candidate.name.toLowerCase() === item.name.toLowerCase());
    if (weapon) await addRole(member, weapon.roleKey);
    const shopItem = Object.values(shopItems).find((candidate) => candidate.name.toLowerCase() === item.name.toLowerCase());
    if (shopItem) await addRole(member, shopItem.roleKey);
  }
}

async function applyInventoryLossForJailOrDeath(member: GuildMember, reason: "jail" | "death") {
  const profile = await getOrCreateGameProfile(member.id, member.guild.id);
  const inventory = getInventory(profile);
  const hasInsurance = inventory.some((item) => item.name === "Insurance") || (await hasRole(member, roleKeys.insurance));
  if (hasInsurance && reason === "jail") {
    await restoreInventoryRoles(member, profile);
    return;
  }
  if (hasInsurance && reason === "death") {
    setInventory(profile, inventory.filter((item) => item.name !== "Insurance"));
    await revokeVirtualRole(member.id, member.guild.id, roleKeys.insurance);
    await saveGameProfile(profile);
    await restoreInventoryRoles(member, profile);
    return;
  }
  setInventory(profile, []);
  await saveGameProfile(profile);
  await removeInventoryRoles(member);
}

async function removeInventoryRoles(member: GuildMember) {
  for (const weapon of Object.values(weapons)) await revokeVirtualRole(member.id, member.guild.id, weapon.roleKey);
  for (const item of Object.values(shopItems)) await revokeVirtualRole(member.id, member.guild.id, item.roleKey);
}

async function addOutsideRole(member: GuildMember) {
  if (!member.roles.cache.has(discordRoleIds.outside)) {
    await member.roles.add(discordRoleIds.outside, "CNR AI Hub: player is outside.").catch(() => null);
  }
}

async function removeOutsideRole(member: GuildMember) {
  if (member.roles.cache.has(discordRoleIds.outside)) {
    await member.roles.remove(discordRoleIds.outside, "CNR AI Hub: player entered an interior or quit.").catch(() => null);
  }
}

async function isRobberyInterrupted(member: GuildMember) {
  return (
    (await hasRole(member, roleKeys.dead)) ||
    (await hasRole(member, roleKeys.jailed)) ||
    (await hasRole(member, roleKeys.cuffed)) ||
    hasCrimeDiscordRole(member, "dead") ||
    hasCrimeDiscordRole(member, "jailed") ||
    hasCrimeDiscordRole(member, "cuffed")
  );
}

function robberyConfig(interiorValue: string) {
  if (interiorValue === "bank") return { seconds: 60, xp: 100, min: 50000, max: 75000 };
  if (interiorValue === "casino") return { seconds: 60, xp: 80, min: 40000, max: 60000 };
  return { seconds: 30, xp: 50, min: 15000, max: 20000 };
}

function crimeRewardMultiplier(member: GuildMember, isHitman = false) {
  if (member.roles.cache.has(moderationRoleIds.gameVip)) return 2;
  if (hasDiscordRole(member, discordRoleNames.fbi)) return 1.5;
  if (isHitman) return 1.5;
  return 1;
}

async function rewardLawCapture(member: GuildMember, suspect: GuildMember, action: "arrest" | "kill", guildId: string) {
  const isLaw = (await hasRole(member, roleKeys.cop)) || (await hasRole(member, roleKeys.fbi)) || hasDiscordRole(member, discordRoleNames.cop) || hasDiscordRole(member, discordRoleNames.fbi);
  const wanted = (await hasRole(suspect, roleKeys.mostWanted)) || hasCrimeDiscordRole(suspect, "mostWanted");
  const suspected = (await hasRole(suspect, roleKeys.suspect)) || hasCrimeDiscordRole(suspect, "suspect") || wanted;
  if (!isLaw || !suspected) return null;

  const base = action === "arrest" ? (wanted ? { money: 5000, xp: 60 } : { money: 3000, xp: 50 }) : wanted ? { money: 4000, xp: 50 } : { money: 2000, xp: 35 };
  const multiplier = crimeRewardMultiplier(member);
  const profile = await getOrCreateGameProfile(member.id, guildId);
  const moneyReward = Math.floor(base.money * multiplier);
  const xpReward = Math.floor(base.xp * multiplier);
  profile.currency += moneyReward;
  profile.total_earned += moneyReward;
  profile.score += wanted ? 5 : 3;
  addExperience(profile, xpReward);
  await saveGameProfile(profile);
  await addTransaction({ discordUserId: member.id, serverId: guildId, type: `law_${action}_reward`, amount: moneyReward, balanceAfter: profile.currency, targetUserId: suspect.id, details: { wanted, xp: xpReward } });
  await resetCrimeStats(suspect);
  return { money: moneyReward, xp: xpReward };
}

async function resetCrimeStats(member: GuildMember) {
  const profile = await getOrCreateGameProfile(member.id, member.guild.id);
  const stats = getStats(profile);
  stats.crime_count = 0;
  stats.suspended_suspect = 0;
  stats.suspended_most_wanted = 0;
  setStats(profile, stats);
  await saveGameProfile(profile);
}

async function applyHealthCap(member: GuildMember, profile: Awaited<ReturnType<typeof getOrCreateGameProfile>>) {
  const boosted =
    member.roles.cache.has(moderationRoleIds.gameVip) ||
    hasDiscordRole(member, discordRoleNames.fbi) ||
    hasDiscordRole(member, discordRoleNames.hitman) ||
    profile.active_mode === "fbi" ||
    profile.active_mode === "hitman";
  const desiredMaxHealth = boosted ? 200 : 100;
  if (profile.max_health !== desiredMaxHealth || (boosted && profile.health !== desiredMaxHealth)) {
    profile.max_health = desiredMaxHealth;
    profile.health = boosted ? desiredMaxHealth : Math.min(profile.health, desiredMaxHealth);
    await saveGameProfile(profile);
  }
}

async function sameInterior(a: GuildMember, b: GuildMember) {
  const [aProfile, bProfile] = await Promise.all([
    getOrCreateGameProfile(a.id, a.guild.id),
    getOrCreateGameProfile(b.id, b.guild.id)
  ]);
  if (aProfile.current_interior && aProfile.current_interior === bProfile.current_interior) return true;
  return a.roles.cache.has(discordRoleIds.outside) && b.roles.cache.has(discordRoleIds.outside);
}

async function enterInterior(member: GuildMember, userId: string, guildId: string, selected: (typeof interiors)[number]) {
  const profile = await getOrCreateGameProfile(userId, guildId);
  const existingInterior = findCurrentInterior(member, profile.current_interior);
  if (existingInterior) {
    if (profile.current_interior !== existingInterior.value) {
      profile.current_interior = existingInterior.value;
      await saveGameProfile(profile);
    }
    return {
      embed: embed(
        "Already Inside",
        `You are already in **${existingInterior.name}**.\nUse \`/exit\` first if you want to leave this interior and enter another one.`,
        warn
      ),
      enteredInterior: null
    };
  }

  await removeInteriorDiscordRoles(member);
  await removeOutsideRole(member);
  profile.current_interior = selected.value;
  await saveGameProfile(profile);
  const addedRole = await addInteriorDiscordRole(member, selected);
  const roleLabel = selected.discordRoleId ? `<@&${selected.discordRoleId}>` : selected.discordRoleName || "location";

  return {
    embed: embed(
      "Interior Entered",
      addedRole
        ? `You entered **${selected.name}** and received ${roleLabel}.`
        : selected.discordRoleName || selected.discordRoleId
          ? `You entered **${selected.name}**, but I could not add ${roleLabel}. Check my role hierarchy and Manage Roles permission.`
          : `You entered **${selected.name}**. No Discord location role is configured for this interior.`,
      ok
    ),
    enteredInterior: selected
  };
}

async function sendInteriorPublicMessages(interaction: ChatInputCommandInteraction | ButtonInteraction, member: GuildMember, interior: (typeof interiors)[number] | null) {
  if (!interior) return;
  await sendChannelEmbeds(interaction, [embed("Interior Update", `<@${member.id}> entered **${interior.name}**.`, ok)]);

  if (interior.value === "ammunation") {
    await sendChannelEmbeds(interaction, [ammunationEmbed()], ammunationRows(member));
  }

  if (interior.value === "item_shop") {
    await sendChannelEmbeds(interaction, [itemShopEmbed()], itemShopRows(member));
  }
}

function ammunationEmbed() {
  return embed("Ammunation Gun List", "Buy weapons or armour using the buttons below.", info).addFields(
    {
      name: "Weapons",
      value: Object.entries(weapons)
        .map(([, weapon]) => `**${weapon.name}** | ${money(weapon.price)} | Damage **${weapon.damage}**`)
        .join("\n"),
      inline: false
    },
    { name: "Armour", value: `**Armour** | ${money(7500)} | Damage **-**`, inline: false }
  );
}

function itemShopEmbed() {
  return embed("Item Shop", "Buy useful CNR tools using the buttons below.", info).addFields(
    {
      name: "Items",
      value: Object.entries(shopItems)
        .map(([, item]) => `**${item.name}** | ${money(item.price)}\n${item.description}`)
        .join("\n\n"),
      inline: false
    }
  );
}

function ammunationRows(member: GuildMember) {
  const buttons = Object.entries(weapons).map(([id, weapon]) =>
    new ButtonBuilder()
      .setCustomId(`cnr_buy_weapon_${id}`)
      .setLabel(weapon.name)
      .setStyle(ButtonStyle.Secondary)
  );
  buttons.push(new ButtonBuilder().setCustomId("cnr_buy_armor").setLabel("Buy Armour").setStyle(ButtonStyle.Primary));
  if (canRobStore(member)) buttons.push(new ButtonBuilder().setCustomId("cnr_button_robstore").setLabel("Rob Store").setStyle(ButtonStyle.Danger));
  return buttonRows(buttons, 4);
}

function itemShopRows(member: GuildMember) {
  const buttons = Object.entries(shopItems).map(([key, item]) =>
    new ButtonBuilder()
      .setCustomId(`cnr_buy_item_${key}`)
      .setLabel(`Buy ${item.name}`)
      .setStyle(ButtonStyle.Secondary)
  );
  if (canRobStore(member)) buttons.push(new ButtonBuilder().setCustomId("cnr_button_robstore").setLabel("Rob Store").setStyle(ButtonStyle.Danger));
  return buttonRows(buttons, 5);
}

function buttonRows(buttons: ButtonBuilder[], size: number) {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let index = 0; index < buttons.length; index += size) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons.slice(index, index + size)));
  }
  return rows;
}

function hasDiscordRole(member: GuildMember, roleName: string) {
  return member.roles.cache.some((role) => role.name.toLowerCase() === roleName.toLowerCase());
}

type CrimeDiscordRole = "suspect" | "mostWanted" | "dead" | "jailed" | "cuffed";

function crimeDiscordRoleNames(kind: CrimeDiscordRole) {
  if (kind === "suspect") return ["Suspected", "Suspect"];
  if (kind === "mostWanted") return ["Most Wanted", "MostWanted", "Mostwanted"];
  if (kind === "dead") return ["Dead"];
  if (kind === "jailed") return ["Jailed"];
  return ["Cuffed"];
}

function hasCrimeDiscordRole(member: GuildMember, kind: CrimeDiscordRole) {
  return crimeDiscordRoleNames(kind).some((roleName) => hasDiscordRole(member, roleName));
}

async function addCrimeDiscordRole(member: GuildMember, kind: Extract<CrimeDiscordRole, "suspect" | "mostWanted">) {
  const role = await findAnyDiscordRoleByName(member, crimeDiscordRoleNames(kind));
  if (role) await member.roles.add(role, `CNR AI Hub: added ${kind}.`).catch(() => null);
}

async function removeCrimeDiscordRoles(member: GuildMember) {
  const roles = [];
  for (const roleName of [...crimeDiscordRoleNames("suspect"), ...crimeDiscordRoleNames("mostWanted"), ...crimeDiscordRoleNames("dead"), ...crimeDiscordRoleNames("jailed"), ...crimeDiscordRoleNames("cuffed")]) {
    const role = await findDiscordRoleByName(member, roleName);
    if (role) roles.push(role);
  }
  if (roles.length) await member.roles.remove(roles, "CNR AI Hub: removed game status roles.").catch(() => null);
}

function canUseModerationAction(member: GuildMember, scope: "game" | "server", action: "warn" | "mute" | "kick" | "ban") {
  if (scope === "game") return hasAnyRoleId(member, [moderationRoleIds.gameModerator, moderationRoleIds.communityModerator, moderationRoleIds.communityAdministrator, moderationRoleIds.communityOwner]);
  if (action === "ban") return hasAnyRoleId(member, [moderationRoleIds.communityAdministrator, moderationRoleIds.communityOwner]);
  return hasAnyRoleId(member, [moderationRoleIds.communityModerator, moderationRoleIds.communityAdministrator, moderationRoleIds.communityOwner]);
}

function canUseModerationLogs(member: GuildMember, scope: "game" | "server") {
  if (scope === "game") return hasAnyRoleId(member, [moderationRoleIds.gameModerator, moderationRoleIds.communityModerator, moderationRoleIds.communityAdministrator, moderationRoleIds.communityOwner]);
  return hasAnyRoleId(member, [moderationRoleIds.communityModerator, moderationRoleIds.communityAdministrator, moderationRoleIds.communityOwner]);
}

function moderationAccessMessage(scope: "game" | "server", action: "warn" | "mute" | "kick" | "ban") {
  if (scope === "game") return "Only Game Moderator, Community Moderator, Community Administrator, or Community Owner can use CNR moderation commands.";
  if (action === "ban") return "Only Community Administrator or Community Owner can use /ban.";
  return "Only Community Moderator, Community Administrator, or Community Owner can use server moderation commands.";
}

function hasAnyRoleId(member: GuildMember, roleIds: string[]) {
  return roleIds.some((roleId) => member.roles.cache.has(roleId));
}

function getClassDiscordRoles(member: GuildMember) {
  return [discordRoleNames.cop, discordRoleNames.robber, discordRoleNames.fbi, discordRoleNames.hitman].filter((roleName) =>
    hasDiscordRole(member, roleName)
  );
}

function canRobStore(member: GuildMember) {
  return hasDiscordRole(member, discordRoleNames.robber) || hasDiscordRole(member, discordRoleNames.hitman);
}

function getClassDiscordRoleIds(member: GuildMember) {
  return [discordRoleNames.cop, discordRoleNames.robber, discordRoleNames.fbi, discordRoleNames.hitman]
    .map((roleName) => member.guild.roles.cache.find((role) => role.name.toLowerCase() === roleName.toLowerCase())?.id)
    .filter((roleId): roleId is string => Boolean(roleId && member.roles.cache.has(roleId)));
}

async function restoreVirtualClassRole(member: GuildMember, roleId: string) {
  const role = member.guild.roles.cache.get(roleId);
  if (!role) return;
  const roleName = role.name.toLowerCase();
  if (roleName === discordRoleNames.cop.toLowerCase()) await addRole(member, roleKeys.cop);
  if (roleName === discordRoleNames.robber.toLowerCase()) await addRole(member, roleKeys.robber);
  if (roleName === discordRoleNames.fbi.toLowerCase()) await addRole(member, roleKeys.fbi);
  if (roleName === discordRoleNames.hitman.toLowerCase()) await addRole(member, roleKeys.hitman);
  const profile = await getOrCreateGameProfile(member.id, member.guild.id);
  if (roleName === discordRoleNames.cop.toLowerCase()) profile.active_mode = "cop";
  if (roleName === discordRoleNames.robber.toLowerCase()) profile.active_mode = "robber";
  if (roleName === discordRoleNames.fbi.toLowerCase()) profile.active_mode = "fbi";
  if (roleName === discordRoleNames.hitman.toLowerCase()) profile.active_mode = "hitman";
  await saveGameProfile(profile);
}

function modeRoleName(mode: keyof typeof gameModes) {
  if (mode === "cop") return discordRoleNames.cop;
  if (mode === "robber") return discordRoleNames.robber;
  if (mode === "fbi") return discordRoleNames.fbi;
  return discordRoleNames.hitman;
}

function isActiveWeapon(name: string) {
  return Object.values(weapons).some((weapon) => weapon.name.toLowerCase() === name.toLowerCase());
}

async function addInteriorDiscordRole(member: GuildMember, interior: (typeof interiors)[number]) {
  if (!interior.discordRoleName && !interior.discordRoleId) return false;
  const role = await findInteriorDiscordRole(member, interior);
  if (!role) return false;
  return member.roles.add(role, `CNR AI Hub: entered ${interior.name}.`).then(
    () => true,
    () => false
  );
}

function interiorRows() {
  const buttons = interiors.map((interior) =>
    new ButtonBuilder()
      .setCustomId(`cnr_interior_${interior.value}`)
      .setLabel(interior.name)
      .setStyle(ButtonStyle.Secondary)
  );
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let index = 0; index < buttons.length; index += 3) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons.slice(index, index + 3)));
  }
  return rows;
}

async function removeInteriorDiscordRoles(member: GuildMember) {
  const locationInteriors = interiors.filter((interior) => interior.discordRoleName || interior.discordRoleId);
  for (const interior of locationInteriors) {
    const role = await findInteriorDiscordRole(member, interior);
    if (role) await member.roles.remove(role, "CNR AI Hub: changed or exited interior.").catch(() => null);
  }
}

async function findInteriorDiscordRole(member: GuildMember, interior: (typeof interiors)[number]) {
  if (interior.discordRoleId) {
    const role = member.guild.roles.cache.get(interior.discordRoleId) || (await member.guild.roles.fetch(interior.discordRoleId).catch(() => null));
    if (role) return role;
  }
  return interior.discordRoleName ? findDiscordRoleByName(member, interior.discordRoleName) : null;
}

async function addDiscordRoleByName(member: GuildMember, roleName: string) {
  const role = await findDiscordRoleByName(member, roleName);
  if (role) await member.roles.add(role, `CNR AI Hub: added ${roleName}.`).catch(() => null);
}

async function removeClassDiscordRoles(member: GuildMember) {
  for (const roleName of [discordRoleNames.cop, discordRoleNames.robber, discordRoleNames.fbi, discordRoleNames.hitman]) {
    await removeDiscordRole(member, roleName);
  }
}

async function removeDiscordRole(member: GuildMember, roleName: string) {
  if (roleName === discordRoleNames.online) {
    await member.roles.remove(discordRoleIds.online, `CNR AI Hub: removed ${roleName}.`).catch(() => null);
    return;
  }
  const role = await findDiscordRoleByName(member, roleName);
  if (role) await member.roles.remove(role, `CNR AI Hub: removed ${roleName}.`).catch(() => null);
}

async function findDiscordRoleByName(member: GuildMember, roleName: string) {
  const target = normalizeRoleName(roleName);
  if (!member.guild.roles.cache.some((role) => normalizeRoleName(role.name) === target)) {
    await member.guild.roles.fetch().catch(() => null);
  }
  return member.guild.roles.cache.find((cachedRole) => cachedRole.name.toLowerCase() === roleName.toLowerCase() || normalizeRoleName(cachedRole.name) === target);
}

async function findAnyDiscordRoleByName(member: GuildMember, roleNames: string[]) {
  for (const roleName of roleNames) {
    const role = await findDiscordRoleByName(member, roleName);
    if (role) return role;
  }
  return null;
}

function normalizeRoleName(roleName: string) {
  return roleName
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function money(amount: number) {
  return `$${amount.toLocaleString("en-US")}`;
}

function commandList(...names: string[]) {
  return names.map((name) => `\`/${name}\``).join(" ");
}

function formatInventoryList(items: ReturnType<typeof getInventory>, includeDamage: boolean) {
  if (!items.length) return "None";
  const counts = new Map<string, { count: number; damage?: number }>();
  for (const item of items) {
    const current = counts.get(item.name) || { count: 0, damage: item.damage };
    current.count += 1;
    if (item.damage) current.damage = item.damage;
    counts.set(item.name, current);
  }
  return Array.from(counts.entries())
    .slice(0, 12)
    .map(([name, item]) => {
      const count = item.count > 1 ? ` x${item.count}` : "";
      const damage = includeDamage && item.damage ? ` - ${item.damage} damage` : "";
      return `**${name}**${count}${damage}`;
    })
    .join("\n")
    .slice(0, 1000);
}

function yesNo(value: boolean) {
  return value ? "YES" : "NO";
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;
}

function findCurrentInterior(member: GuildMember, currentInterior: string) {
  return (
    interiors.find((interior) => interior.value === currentInterior) ||
    interiors.find((interior) => Boolean(interior.discordRoleId && member.roles.cache.has(interior.discordRoleId))) ||
    interiors.find((interior) => Boolean(interior.discordRoleName && hasDiscordRole(member, interior.discordRoleName)))
  );
}

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseDuration(input: string) {
  const match = input.trim().match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit as keyof typeof multipliers];
}

function hasSecretLikeText(text: string) {
  return /(token|api[_ -]?key|password|secret|otp|discord\.[a-z0-9_-]{20,})/i.test(text);
}

async function commandMiddleware(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember | null;
  await upsertDiscordUser(interaction.user, interaction.guild, member);
}

async function deferCommand(interaction: ChatInputCommandInteraction) {
  const privateReply = privateReplyCommands.has(interaction.commandName);
  await interaction.deferReply(privateReply ? { flags: MessageFlags.Ephemeral } : {});

  const patchedInteraction = interaction as ChatInputCommandInteraction & {
    reply: (options: string | Record<string, unknown>) => ReturnType<ChatInputCommandInteraction["editReply"]>;
  };

  patchedInteraction.reply = ((options) => {
    const response = typeof options === "string" ? { content: options } : { ...options };
    delete (response as { ephemeral?: boolean }).ephemeral;
    return interaction.editReply(response as Parameters<ChatInputCommandInteraction["editReply"]>[0]);
  }) as typeof patchedInteraction.reply;
}

export async function executeCommand(interaction: ChatInputCommandInteraction) {
  const command = commandMap.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: "Unknown command.", ephemeral: true });
    return;
  }
  await deferCommand(interaction);
  await commandMiddleware(interaction);
  await command.execute(interaction);
}

declare module "discord.js" {
  interface SlashCommandBuilder {
    toCommand(execute: (interaction: ChatInputCommandInteraction) => Promise<void>): CommandDefinition;
  }
  interface SlashCommandOptionsOnlyBuilder {
    toCommand(execute: (interaction: ChatInputCommandInteraction) => Promise<void>): CommandDefinition;
  }
  interface SlashCommandSubcommandsOnlyBuilder {
    toCommand(execute: (interaction: ChatInputCommandInteraction) => Promise<void>): CommandDefinition;
  }
}
