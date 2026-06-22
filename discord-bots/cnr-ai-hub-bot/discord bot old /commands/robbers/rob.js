const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const validRoles = [
  '1248697926515953694', // Hitman
  '1248188281976389689', // Robber
  '1248949429713764353', // FBI
  '1247162188913971272'  // Cop
];

const restrictedRoles = [
  '1247170843616874518', // Jailed
  '1247164748278140978'  // Dead
];

const interiorRoles = [
  '1247197731475161198', // Ammunation
  '1247197700051701842', // Bank
  '1248188152997478450', // Black Market
  '1247197782146678804', // Item Shop
  '1291385955193978952', // Casino
  '1291385987091402834'  // Restraunt
];

function loadProfile(userId) {
  const filePath = path.join(__dirname, '..', '..', '..', 'savedata', `${userId}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

function saveProfile(profile) {
  const filePath = path.join(__dirname, '..', '..', '..', 'savedata', `${profile.userId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
}

module.exports = {
  name: 'rob',
  async execute(message, args) {
    const isHitman = message.member.roles.cache.has('1248697926515953694');
    const isRobber = message.member.roles.cache.has('1248188281976389689');
    const isValidRole = isHitman || isRobber;

    if (!isValidRole) {
      await message.reply('Only Hitmen and Robbers can use this command!');
      return;
    }

    if (message.member.roles.cache.some(role => restrictedRoles.includes(role.id))) {
      await message.reply('You cannot rob while jailed or dead!');
      return;
    }

    const target = message.mentions.members.first();
    if (!target) {
      await message.reply('You need to mention a user to rob. Usage: !rob @User');
      return;
    }

    const robberProfile = loadProfile(message.author.id);
    const targetProfile = loadProfile(target.id);

    if (!robberProfile || !targetProfile) {
      await message.reply('Profile data not found!');
      return;
    }

    const hasWallet = targetProfile.inventory.some(item => item.name === "wallet");
    if (hasWallet) {
      await message.reply('Target has a wallet! You cannot rob them.');
      return;
    }

    const targetHasValidRole = target.roles.cache.some(role => validRoles.includes(role.id));
    if (!targetHasValidRole) {
      await message.reply('You can only rob players in game mode!');
      return;
    }

    const userInteriors = message.member.roles.cache.filter(role => interiorRoles.includes(role.id));
    const targetInteriors = target.roles.cache.filter(role => interiorRoles.includes(role.id));
    
    const sameInterior = userInteriors.some(role => targetInteriors.has(role.id));
    if (!sameInterior) {
      await message.reply('You must be in the same interior as your target!');
      return;
    }

    const amount = Math.floor(Math.random() * (20000 - 5000 + 1)) + 5000;

    if (targetProfile.currency < amount) {
      await message.reply('Target does not have enough money to rob!');
      return;
    }

    // Add XP based on role
    const xpGain = isHitman ? 30 : 20;
    robberProfile.xp = (robberProfile.xp || 0) + xpGain;

    targetProfile.currency -= amount;
    robberProfile.currency += amount;

    saveProfile(targetProfile);
    saveProfile(robberProfile);

    const suspectedRole = message.guild.roles.cache.get('YOUR_SUSPECTED_ROLE_ID');
    if (suspectedRole) {
      await message.member.roles.add(suspectedRole);
    }

    const embed = new EmbedBuilder()
      .setTitle('🦹 Robbery Success')
      .setDescription(`${message.author} robbed ${target}`)
      .addFields(
        { name: 'Amount Stolen', value: `$${amount.toLocaleString()}` },
        { name: 'Your New Balance', value: `$${robberProfile.currency.toLocaleString()}` },
        { name: 'XP Gained', value: `+${xpGain} XP` },
        { name: 'Status', value: 'You are now suspected!' }
      )
      .setColor(0xFF0000)
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    console.log(`${new Date()}: ${message.author.tag} robbed ${target.user.tag} for $${amount} and gained ${xpGain} XP`);
  },
};