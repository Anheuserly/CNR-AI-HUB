const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jail')
    .setDescription('Jail a cuffed suspect')
    .addUserOption(option => 
      option.setName('suspect')
        .setDescription('The suspect to jail')
        .setRequired(true)), // The suspect option is required
  async execute(interaction) {
    const copRoleId = '1247162188913971272';
    const jailedRoleId = '1247170843616874518';
    const cuffedRoleId = '1263908645763158157';

    const member = interaction.member; // The cop (command issuer)
    const suspect = interaction.options.getMember('suspect'); // The selected suspect from the command

    // Check if the user is a cop
    if (!member.roles.cache.has(copRoleId)) {
      return interaction.reply({ content: '❌ You are not assigned as a cop to jail someone. Use `/copduty` to get assigned.', ephemeral: true });
    }

    // Check if the suspect is cuffed
    if (!suspect.roles.cache.has(cuffedRoleId)) {
      const messageEmbed = new EmbedBuilder()
        .setTitle('❌ Can\'t Jail')
        .setDescription(`You can't jail ${suspect.displayName} because they are not cuffed.`)
        .setColor('Red');
      return interaction.reply({ embeds: [messageEmbed], ephemeral: true });
    }

    // Remove cuffed role and add jailed role
    await suspect.roles.remove(cuffedRoleId);
    await suspect.roles.add(jailedRoleId);

    const jailEmbed = new EmbedBuilder()
      .setTitle('⛓️ Suspect Jailed')
      .setDescription(`You have jailed ${suspect.displayName}.`)
      .setColor('DarkRed');

    await interaction.reply({ embeds: [jailEmbed] });

    // Jail timer (5 minutes countdown)
    for (let i = 5; i > 0; i--) {
      await new Promise(resolve => setTimeout(resolve, 60000)); // wait 1 minute
      await suspect.send(`${i} minute(s) left in jail!`);
    }

    // Release from jail
    await suspect.roles.remove(jailedRoleId);
    await suspect.send('🔓 You have been released from jail.');
  },
};
