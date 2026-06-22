const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager'); // Ensure these are imported

const gameRoles = [
  '1247162188913971272', // Cop role ID
  '1248949429713764353', // FBI role ID
  '1248697926515953694', // Hitman role ID
  '1248188281976389689', // Robber role ID
];

const requiredRoles = {
  'fbi': '1292564394663874650', // Required role ID for FBI
  'hitman': '1292564456928186479', // Required role ID for Hitman
};

module.exports = {
  data: {
    name: 'cnr', // Command name
    description: 'Join the Cops and Robbers game',
  },
  
  async execute(interaction) {
    const member = interaction.member;

    // Check if the user already has one of the game roles
    if (member.roles.cache.some(role => gameRoles.includes(role.id))) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(`${interaction.user}, you are already in the game!`)
        .setColor('#FF0000');
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(':man_police_officer: Choose Your Duty :man_detective:')
      .setDescription('Select the duty you want to join. You must have the required roles to join FBI or Hitman.')
      .setColor('#0000FF');

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('fbi')
          .setLabel('FBI')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('hitman')
          .setLabel('Hitman')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('cop')
          .setLabel('Cop')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('robber')
          .setLabel('Robber')
          .setStyle(ButtonStyle.Primary)
      );

    const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const filter = i => i.user.id === interaction.user.id;
    const collector = response.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      // Map button custom IDs to actual role IDs
      const roleMapping = {
        'fbi': '1248949429713764353', // FBI role ID
        'hitman': '1248697926515953694', // Hitman role ID
        'cop': '1247162188913971272', // Cop role ID
        'robber': '1248188281976389689' // Robber role ID
      };

      const roleId = roleMapping[i.customId];
      const role = interaction.guild.roles.cache.get(roleId);

      // Check for required roles for FBI and Hitman
      if ((i.customId === 'fbi' && !member.roles.cache.has(requiredRoles.fbi)) ||
          (i.customId === 'hitman' && !member.roles.cache.has(requiredRoles.hitman))) {
        await i.reply({ content: `You need the required role to join as ${i.customId}.`, ephemeral: true });
        return; // Do not proceed if the user doesn't have the required role
      }

      if (role) {
        await member.roles.add(role);

        // Update user's health based on role selection
        if (i.customId === 'fbi' || i.customId === 'hitman') {
          await updateHealth(member.id, 200); // Set health to 200
        }

        await i.update({ content: `You've chosen to be a ${i.customId}!`, components: [] });
      } else {
        await i.update({ content: 'Role not found!', components: [] });
      }
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        interaction.followUp({ content: 'No selection was made.', ephemeral: true });
      } else {
        // Reset health to 100 if FBI or Hitman roles are removed
        const fbiRole = interaction.guild.roles.cache.get(requiredRoles.fbi);
        const hitmanRole = interaction.guild.roles.cache.get(requiredRoles.hitman);
        
        if (member.roles.cache.has(fbiRole.id)) {
          await member.roles.remove(fbiRole);
          await updateHealth(member.id, 100); // Reset health to 100
        }

        if (member.roles.cache.has(hitmanRole.id)) {
          await member.roles.remove(hitmanRole);
          await updateHealth(member.id, 100); // Reset health to 100
        }
      }
    });
  },
};

// Function to update health in the user's profile
async function updateHealth(userId, newHealth) {
  const profile = await getOrCreateUserProfile(userId);
  profile.health = newHealth; // Set the new health
  profile.maxHealth = newHealth; // Optionally set maxHealth to match
  await saveUserProfile(userId, profile); // Save the updated profile
}
