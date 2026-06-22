const { EmbedBuilder } = require('discord.js');
const { getOrCreateUserProfile } = require('../../utils/profileManager');

const cooldowns = new Map();

const interiors = [
  { name: 'Ammunation', roleID: '1247197731475161198' },
  { name: 'Bank', roleID: '1247197700051701842' },
  { name: 'hospital', roleID: '1338183807798349855' },
  { name: 'Item Shop', roleID: '1247197782146678804' },
  { name: 'Casino', roleID: '1291385955193978952' },
  { name: 'Restraunt', roleID: '1291385987091402834' },
];

module.exports = {
  name: 'robstore',
  description: 'Rob a store based on your interior roles.',
  
  async execute(message, args) {
    const roleIds = {
      robber: '1248188281976389689',
      hitman: '1248697926515953694',
      cop: '1247162188913971272',
      fbi: '1248949429713764353',
      suspect: '1247162056793391175',
    };

    const cooldownTime = 3 * 60 * 1000;
    const robberyDelay = 1 * 60 * 1000;
    const userId = message.author.id;

    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + cooldownTime;
      if (Date.now() < expirationTime) {
        const timeLeft = Math.ceil((expirationTime - Date.now()) / 1000);
        const cooldownEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Cooldown')
          .setDescription(`Please wait **${timeLeft}** more seconds before attempting another robbery.`);

        return message.reply({ embeds: [cooldownEmbed], ephemeral: true });
      }
    }

    // Check if user is a Robber or Hitman
    const isRobber = message.member.roles.cache.has(roleIds.robber);
    const isHitman = message.member.roles.cache.has(roleIds.hitman);

    if (!isRobber && !isHitman) {
      const noRoleEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Robbery Denied')
        .setDescription("Only Robbers and Hitmen can rob stores!");
      return message.reply({ embeds: [noRoleEmbed], ephemeral: true });
    }

    if (message.member.roles.cache.has(roleIds.cop) || message.member.roles.cache.has(roleIds.fbi)) {
      const noRobEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Robbery Denied')
        .setDescription("You can't rob because you're law enforcement.");

      return message.reply({ embeds: [noRobEmbed], ephemeral: true });
    }

    const userRoles = message.member.roles.cache;
    const availableInteriors = interiors.filter(interior => userRoles.has(interior.roleID));

    if (availableInteriors.length === 0) {
      const noRoleEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Robbery Denied')
        .setDescription("You don't have the required interior roles to perform a robbery.");
      return message.reply({ embeds: [noRoleEmbed], ephemeral: true });
    }

    const selectedInterior = availableInteriors[Math.floor(Math.random() * availableInteriors.length)];

    const attemptEmbed = new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle(`🔫 Robbery in Progress`)
      .setDescription(`🚨 ${message.author.username} has started robbing the ${selectedInterior.name}! Everyone hit the floor!`);

    await message.reply({ embeds: [attemptEmbed] });

    const roleplayEmbed = new EmbedBuilder()
      .setColor('#FF4500')
      .setTitle(`🔫 ${selectedInterior.name} Robbery in Progress`)
      .setDescription(
        "The sound of chaos fills the store as the robber demands everyone to comply.\n\n" +
        "💼 Shop Owner: \"Whoa there! Easy! Take whatever you need, just don't shoot!\"\n\n" +
        "😨 Customer: \"This is not what I signed up for when I came here!\"\n\n" +
        "💀 Robber: \"Nobody move! Open the register and the safe, and make it quick!\""
      );

    await message.channel.send({ embeds: [roleplayEmbed] });

    const suspectRole = message.guild.roles.cache.get(roleIds.suspect);
    if (suspectRole) {
      try {
        await message.member.roles.add(suspectRole);
      } catch (error) {
        console.error('Failed to assign suspect role:', error);
      }
    }

    cooldowns.set(userId, Date.now());

    const robberyAmount = Math.floor(Math.random() * (80000 - 30000 + 1)) + 50000;
    const xpAmount = isHitman ? 35 : 25; // 35 XP for Hitman, 25 XP for Robber

    setTimeout(async () => {
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Robbery Successful')
        .setDescription(`💸 ${message.author.username} successfully completed the robbery at ${selectedInterior.name}!`)
        .addFields(
          { name: 'Money Stolen', value: `$${robberyAmount.toLocaleString()}`, inline: true },
          { name: 'XP Gained', value: `${xpAmount} XP`, inline: true }
        );

      await message.channel.send({ embeds: [successEmbed] });

      const userProfile = await getOrCreateUserProfile(userId);
      userProfile.currency += robberyAmount;
      userProfile.xp = (userProfile.xp || 0) + xpAmount;

      await saveUserProfile(userProfile);

      const copsArriveEmbed = new EmbedBuilder()
        .setColor('#0000FF')
        .setTitle('🚔 Cops Arrive')
        .setDescription(
          `🔔 The alarm has alerted the cops! They have arrived and are covering the outside of the ${selectedInterior.name}.\n\n` +
          `👮 Cop 1: "This is the police! The building is surrounded! Drop your weapons and come out with your hands up!"\n\n` +
          `👮 Cop 2: "We have every exit covered. There's no escape!"\n\n` +
          `🔫 Robber: "You think I'm scared of you?! I've got hostages in here!"`
        );

      await message.channel.send({ embeds: [copsArriveEmbed] });
    }, robberyDelay);

    setTimeout(() => cooldowns.delete(userId), cooldownTime);
  },
};

async function saveUserProfile(profile) {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '..', '..', '..', 'savedata', `${profile.userId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
}