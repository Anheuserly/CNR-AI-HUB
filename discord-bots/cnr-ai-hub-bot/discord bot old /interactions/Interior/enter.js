const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const interiors = [
  { name: 'Ammunation', roleID: '1247197731475161198' },
  { name: 'Bank', roleID: '1247197700051701842' },
  { name: 'Item Shop', roleID: '1247197782146678804' },
  { name: 'Casino', roleID: '1291385955193978952' },
  { name: 'Restaurant', roleID: '1291385987091402834' },
  { name: 'Nightclub', roleID: '1291386019985143040'},
  { name: 'Cluckin Bell', roleID: '129138604287562624'},
  { name: 'Maze Bank', roleID: '1291386065766201600'},
  { name: 'Vagos', roleID: '1291386098658972160'},
  { name: 'The Diamond Casino & Resort', roleID: '129138612154234'},
  { name: 'Hospital', roleID: '1291385992234567891' },
  { name: 'Library', roleID: '1291385993234567892' },
  { name: 'Hotel', roleID: '1291385994234567893' },
  { name: 'Park', roleID: '1291385995234567894' },
  { name: 'Gym', roleID: '1291385996234567895' },
  { name: 'Beach', roleID: '1291385997234567896' },
  { name: 'Supermarket', roleID: '1291385998234567897' },
  { name: 'Post Office', roleID: '1291385999234567898' },
  { name: 'Bar', roleID: '1291386000234567899' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('enter')
    .setDescription('Enter a specific interior.')
    .addStringOption(option => 
      option.setName('interior')
        .setDescription('The name of the interior to enter')
        .setRequired(true)
        .addChoices(
          { name: 'Ammunation', value: 'ammunation' },
          { name: 'Bank', value: 'bank' },
          { name: 'Item Shop', value: 'item shop' },
          { name: 'Casino', value: 'casino' },
          { name: 'Restaurant', value: 'restaurant' },
          { name: 'NighttClub', value: 'nightclub' },
          { name: 'Cluckin Bell', value: 'cluckin bell' },
          { name: 'Maze Bank', value: 'maze bank' },
          { name: 'Vagos', value: 'vagos' },
          { name: 'The Diamond Casino & Resort', value: 'the diamond casino & resort'},
           { name: 'Hospital', value: 'hospital' },
          { name: 'Library', value: 'library' },
          { name: 'Hotel', value: 'hotel' },
          { name: 'Park', value: 'park' },
          { name: 'Gym', value: 'gym' },
          { name: 'Beach', value: 'beach' },
          { name: 'Supermarket', value: 'supermarket' },
          { name: 'Post Office', value: 'post office' },
          { name: 'Bar', value: 'bar' }

        )),

  async execute(interaction) {
    const restrictedRoleIDs = [
      '1247170843616874518', // Jailed
      '1247164748278140978'  // Dead
    ];

    const gameModeRoles = [
      '1248949429713764353', // FBI
      '1247162188913971272', // Cop
      '1248697926515953694', // Hitman
      '1248188281976389689'  // Robber
    ];

    const member = interaction.member;
    const interiorName = interaction.options.getString('interior');

    // Check if the user has any restricted roles
    if (member.roles.cache.some(role => restrictedRoleIDs.includes(role.id))) {
      return interaction.reply("🚫 You cannot enter this interior while you are jailed or dead.");
    }

    // Check if the user has any of the game mode roles
    if (!member.roles.cache.some(role => gameModeRoles.includes(role.id))) {
      return interaction.reply("🚫 You are not in game mode.");
    }

    // Find the selected interior
    const selectedInterior = interiors.find(interior => interior.name.toLowerCase() === interiorName.toLowerCase());
    if (!selectedInterior) {
      return interaction.reply("❓ Invalid interior name. Please choose a valid interior.");
    }

    // Check if the user already has any interior role
    const hasInteriorRole = interiors.some(interior => member.roles.cache.has(interior.roleID));
    if (hasInteriorRole) {
      return interaction.reply("🚫 You cannot enter another interior while you are already in one.");
    }

    // Grant the role for the selected interior
    const role = interaction.guild.roles.cache.get(selectedInterior.roleID);
    if (role) {
      try {
        await member.roles.add(role);
        const entryEmbed = new EmbedBuilder()
          .setTitle(`Entered ${selectedInterior.name}`)
          .setDescription(`You have entered the ${selectedInterior.name}, ${member.user.username}.`)
          .setColor(0x8B0000);

        await interaction.reply({ embeds: [entryEmbed] });
        console.log(`${new Date()}: ${member.user.username} has entered the ${selectedInterior.name}.`);
      } catch (error) {
        await interaction.reply(`⚠️ An error occurred while trying to enter the ${selectedInterior.name}.`);
        console.error(`Error granting role: ${error.message}`);
      }
    } else {
      await interaction.reply("❓ Role not found!");
    }
  },
};
