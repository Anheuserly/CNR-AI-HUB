const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'cuff',
  description: 'Cuff a suspect',
  async execute(message, args) {
    const copRoleId = '1247162188913971272';
    const suspectRoleId = '1247162056793391175';
    const cuffedRoleId = '1263908645763158157';
    
    const member = message.member; // The cop (command issuer)
    const suspect = message.mentions.members.first(); // Mentioned suspect

    // Check if a suspect was mentioned
    if (!suspect) {
      return message.reply('❌ You need to mention a suspect to cuff.');
    }

    // Check if the user is a cop
    if (!member.roles.cache.has(copRoleId)) {
      return message.reply('❌ You are not assigned as a cop to cuff someone. Use `/copduty` to get assigned.');
    }

    // Check if the suspect has the suspect role
    if (!suspect.roles.cache.has(suspectRoleId)) {
      const messageEmbed = new EmbedBuilder()
        .setTitle('❌ You can only cuff a suspect')
        .setDescription(`You can only cuff a suspect, not ${suspect.displayName}.`)
        .setColor('Red');
      return message.channel.send({ embeds: [messageEmbed] });
    }

    // Add more checks here if necessary (e.g., is the suspect already dead, jailed, etc.)

    // Remove suspect role and add cuffed role
    await suspect.roles.remove(suspectRoleId);
    await suspect.roles.add(cuffedRoleId);

    const cuffEmbed = new EmbedBuilder()
      .setTitle('🔒 You Cuffed a Suspect')
      .setDescription(`You have cuffed ${suspect.displayName}.`)
      .setColor('DarkRed');

    await message.channel.send({ embeds: [cuffEmbed] });
  },
};
