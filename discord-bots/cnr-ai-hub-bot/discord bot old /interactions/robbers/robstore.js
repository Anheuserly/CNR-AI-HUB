const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateUserProfile } = require('../../utils/profileManager');

// Cooldown Map to store users and their cooldown timestamps
const cooldowns = new Map();

// Define the interiors and their corresponding roles
const interiors = [
  { name: 'Ammunation', roleID: '1247197731475161198' },
  { name: 'Bank', roleID: '1247197700051701842' },
  { name: 'Black Market', roleID: '1248188152997478450' },
  { name: 'Item Shop', roleID: '1247197782146678804' },
  { name: 'Casino', roleID: '1291385955193978952' },
  { name: 'Restaurant', roleID: '1291385987091402834' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('robstore')
    .setDescription('Rob a store based on your interior roles.'),

  async execute(interaction) {
    const roleIds = {
      robber: '1248188281976389689',
      cop: '1247162188913971272',
      fbi: '1248949429713764353',
      suspect: '1247162056793391175',
    };

    const cooldownTime = 3 * 60 * 1000; // 3 minutes in milliseconds
    const robberyDelay = 1 * 60 * 1000; // 1 minute in milliseconds
    const userId = interaction.user.id;

    // Check if the user is on cooldown
    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + cooldownTime;
      if (Date.now() < expirationTime) {
        const timeLeft = Math.ceil((expirationTime - Date.now()) / 1000);
        const cooldownEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Cooldown')
          .setDescription(`Please wait **${timeLeft}** more seconds before attempting another robbery.`);

        return interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
      }
    }

    // Check if the user has a law enforcement role
    if (interaction.member.roles.cache.has(roleIds.cop) || interaction.member.roles.cache.has(roleIds.fbi)) {
      const noRobEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Robbery Denied')
        .setDescription("You can't rob because you're law enforcement.");

      return interaction.reply({ embeds: [noRobEmbed], ephemeral: true });
    }

    // Check for available interior roles
    const userRoles = interaction.member.roles.cache;
    const availableInteriors = interiors.filter(interior => userRoles.has(interior.roleID));

    if (availableInteriors.length === 0) {
      const noRoleEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Robbery Denied')
        .setDescription("You don't have the required interior roles to perform a robbery.");
      return interaction.reply({ embeds: [noRoleEmbed], ephemeral: true });
    }

    // Randomly select an interior from the user's available roles
    const selectedInterior = availableInteriors[Math.floor(Math.random() * availableInteriors.length)];

    // Proceed with the robbery logic
    const attemptEmbed = new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle(`🔫 Robbery in Progress`)
      .setDescription(`🚨 ${interaction.user.username} has started robbing the ${selectedInterior.name}! Everyone hit the floor!`);

    await interaction.reply({ embeds: [attemptEmbed] });

    // Send roleplay embed
    const roleplayEmbed = new EmbedBuilder()
      .setColor('#FF4500')
      .setTitle(`🔫 ${selectedInterior.name} Robbery in Progress`)
      .setDescription(
        "The sound of chaos fills the store as the robber demands everyone to comply.\n\n" +
        "💼 Shop Owner: \"Whoa there! Easy! Take whatever you need, just don't shoot!\"\n\n" +
        "😨 Customer: \"This is not what I signed up for when I came here!\"\n\n" +
        "💀 Robber: \"Nobody move! Open the register and the safe, and make it quick!\""
      );

    await interaction.channel.send({ embeds: [roleplayEmbed] });

    // Assign the suspect role to the user
    const suspectRole = interaction.guild.roles.cache.get(roleIds.suspect);
    if (suspectRole) {
      try {
        await interaction.member.roles.add(suspectRole);
      } catch (error) {
        console.error('Failed to assign suspect role:', error);
        return interaction.channel.send({ content: 'Failed to assign suspect role. Please try again later.', ephemeral: true });
      }
    }

    // Set the cooldown for the user immediately
    cooldowns.set(userId, Date.now());

    // Generate a random amount between 50,000 and 140,000
    const robberyAmount = Math.floor(Math.random() * (140000 - 50000 + 1)) + 50000;

    // Schedule the success message after 1 minute (robberyDelay)
    setTimeout(async () => {
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Robbery Successful')
        .setDescription(`💸 ${interaction.user.username} successfully completed the robbery at ${selectedInterior.name} and stole **$${robberyAmount}**!`);

      await interaction.channel.send({ embeds: [successEmbed] });

      // Update user currency in profile manager
      const userProfile = await getOrCreateUserProfile(userId);
      userProfile.currency += robberyAmount;

      // Save the updated profile
      await saveUserProfile(userProfile);

      // Send the cops arrive embed
      const copsArriveEmbed = new EmbedBuilder()
        .setColor('#0000FF')
        .setTitle('🚔 Cops Arrive')
        .setDescription(
          `🔔 The alarm has alerted the cops! They have arrived and are covering the outside of the ${selectedInterior.name}.\n\n` +
          `👮 Cop 1: "This is the police! The building is surrounded! Drop your weapons and come out with your hands up!"\n\n` +
          `👮 Cop 2: "We have every exit covered. There's no escape!"\n\n` +
          `🔫 Robber: "You think I'm scared of you?! I've got hostages in here!"`
        );

      await interaction.channel.send({ embeds: [copsArriveEmbed] });
    }, robberyDelay);

    // Remove the cooldown after 3 minutes to free up memory
    setTimeout(() => cooldowns.delete(userId), cooldownTime);
  },
};

// Assuming this function is defined in your profile manager
async function saveUserProfile(profile) {
  const fs = require('fs');
  const path = require('path');

  const filePath = path.join(__dirname, '..', '..', '..', 'savedata', `${profile.userId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
}
