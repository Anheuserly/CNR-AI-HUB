const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quit')
    .setDescription('Quit the current game and revoke all associated roles.'),

  async execute(interaction) {
    const gameModeRoles = [
      '1248949429713764353', // FBI
      '1247162188913971272', // Cop
      '1248697926515953694', // Hitman
      '1248188281976389689'  // Robber
    ];

    const interiorRoles = [
      '1247197700051701842', // inBank
      '1247197731475161198', // inAmmunation
      '1247197782146678804', // inItemShop
      '1291385987091402834', // inRestaurant
      '1291385955193978952'  // inCasino
    ];

    const member = interaction.member;

    // Check if the member has any game mode roles
    const hasGameModeRole = gameModeRoles.some(roleID => member.roles.cache.has(roleID));

    // If the member does not have any game mode roles, reply with a message
    if (!hasGameModeRole) {
      return await interaction.reply({
        content: '⚠️ You are not in game mode. You do not have any game mode roles.',
        ephemeral: true // Makes the message visible only to the user
      });
    }

    // Create an array of all roles to revoke
    const rolesToRevoke = [...gameModeRoles, ...interiorRoles];

    // Create an embed for confirmation
    const confirmationEmbed = new EmbedBuilder()
      .setColor(0x008000) // Green color for success
      .setTitle('Successfully Quit')
      .setDescription('You have successfully quit the game, and all associated roles have been revoked.')
      .addFields([
        {
          name: 'Roles Revoked:',
          value: rolesToRevoke.map(roleID => {
            const role = interaction.guild.roles.cache.get(roleID);
            return role ? role.name : 'Unknown Role';
          }).join(', '),
        },
      ])
      .setTimestamp();

    // Try to revoke the roles
    try {
      await Promise.all(
        rolesToRevoke.map(roleID => {
          const role = interaction.guild.roles.cache.get(roleID);
          if (role && member.roles.cache.has(role.id)) {
            return member.roles.remove(role);
          }
        })
      );

      await interaction.reply({ embeds: [confirmationEmbed] });
      console.log(`${new Date()}: ${member.user.username} has quit the game and roles have been revoked.`);
    } catch (error) {
      await interaction.reply("⚠️ An error occurred while trying to revoke roles.");
      console.error(`Error revoking roles: ${error.message}`);
    }
  },
};
