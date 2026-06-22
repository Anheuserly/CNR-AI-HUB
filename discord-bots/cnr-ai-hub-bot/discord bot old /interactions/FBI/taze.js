const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('taze')
    .setDescription('Taze a suspect')
    .addUserOption(option => 
      option.setName('suspect')
        .setDescription('The suspect to taze')
        .setRequired(true)), // Required suspect option
  async execute(interaction) {
    const fbiRoleId = '1248949429713764353';
    const suspectRoleId = '1247162056793391175';
    const freezeRoleId = '1272151730368417903';
    const bankInteriorRoleId = '1247197700051701842';
    const ammunationInteriorRoleId = '1247197731475161198';
    const itemshopInteriorRoleId = '1247197782146678804';
    const blackmarketInteriorRoleId = '1248188152997478450';

    const member = interaction.member; // The FBI agent (command issuer)
    const suspect = interaction.options.getMember('suspect'); // The selected suspect

    // Check if the user is an FBI agent
    if (!member.roles.cache.has(fbiRoleId)) {
      const unauthorizedMessage = new EmbedBuilder()
        .setTitle('⚠️ Unauthorized Action')
        .setDescription('Only FBI agents can use the taze command.')
        .setColor('Red');
      return interaction.reply({ embeds: [unauthorizedMessage], ephemeral: true });
    }

    // Check if the suspect has the suspect role
    if (!suspect.roles.cache.has(suspectRoleId)) {
      const invalidTargetMessage = new EmbedBuilder()
        .setTitle('⚠️ Invalid Target')
        .setDescription('You can only taze suspects.')
        .setColor('Red');
      return interaction.reply({ embeds: [invalidTargetMessage], ephemeral: true });
    }

    // Check if both FBI and suspect are in the same interior
    const interiorRoles = [bankInteriorRoleId, ammunationInteriorRoleId, itemshopInteriorRoleId, blackmarketInteriorRoleId];
    const sameInterior = interiorRoles.some(roleId => 
      member.roles.cache.has(roleId) && suspect.roles.cache.has(roleId)
    );

    if (!sameInterior) {
      const notSameInteriorMessage = new EmbedBuilder()
        .setTitle('⚠️ Not in the Same Interior')
        .setDescription('You must be in the same interior as the suspect to taze them.')
        .setColor('Red');
      return interaction.reply({ embeds: [notSameInteriorMessage], ephemeral: true });
    }

    // Taze the suspect
    const tazeTime = Math.floor(Math.random() * 3) + 3; // Random time between 3 and 5 seconds

    const tazeMessage = new EmbedBuilder()
      .setTitle('⚡ Suspect Tazed')
      .setDescription(`${suspect.displayName} has been tazed by ${member.displayName} for ${tazeTime} seconds!`)
      .setColor('Yellow');

    await interaction.reply({ embeds: [tazeMessage] });

    // Apply the freeze role to the suspect
    await suspect.roles.add(freezeRoleId);

    // Wait for the taze duration
    await new Promise(resolve => setTimeout(resolve, tazeTime * 1000));

    // Remove the freeze role
    await suspect.roles.remove(freezeRoleId);

    const releaseMessage = new EmbedBuilder()
      .setTitle('🔓 Suspect Released')
      .setDescription(`${suspect.displayName} is no longer tazed.`)
      .setColor('Green');

    await interaction.followUp({ embeds: [releaseMessage] });
  },
};
