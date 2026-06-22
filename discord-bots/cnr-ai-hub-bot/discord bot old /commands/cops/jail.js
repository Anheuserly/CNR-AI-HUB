const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'jail',
  description: 'Jail a cuffed suspect',
  async execute(message, args) {
    const copRoleId = '1247162188913971272';
    const jailedRoleId = '1247170843616874518';
    const cuffedRoleId = '1263908645763158157';
    
    const member = message.member; // The cop (command issuer)
    const suspect = message.mentions.members.first(); // Mentioned suspect

    // Check if a suspect was mentioned
    if (!suspect) {
      return message.reply('❌ You need to mention a suspect to jail.');
    }

    // Check if the user is a cop
    if (!member.roles.cache.has(copRoleId)) {
      return message.reply('❌ You are not assigned as a cop to jail someone. Use `/copduty` to get assigned.');
    }

    // Check if the suspect is cuffed
    if (!suspect.roles.cache.has(cuffedRoleId)) {
      const messageEmbed = new EmbedBuilder()
        .setTitle('❌ You can\'t jail someone who is not cuffed')
        .setDescription(`You can't jail ${suspect.displayName} because they are not cuffed.`)
        .setColor('Red');
      return message.channel.send({ embeds: [messageEmbed] });
    }

    // Add more checks here (e.g., dead, already jailed, etc.)

    // Remove cuffed role and add jailed role
    await suspect.roles.remove(cuffedRoleId);
    await suspect.roles.add(jailedRoleId);

    const jailEmbed = new EmbedBuilder()
      .setTitle('⛓️ You Jailed a Suspect')
      .setDescription(`You have jailed ${suspect.displayName}.`)
      .setColor('DarkRed');

    await message.channel.send({ embeds: [jailEmbed] });

    // Jail timer (5 minutes countdown)
    for (let i = 5; i > 0; i--) {
      await new Promise(resolve => setTimeout(resolve, 60000)); // wait 1 minute
      await suspect.send(`${i} minute(s) left in jail!`);
    }

    // Release from jail
    await suspect.roles.remove(jailedRoleId);
    await suspect.roles.add(cuffedRoleId); // Optionally re-add the cuffed role if needed
    await suspect.send(`🔓 You have been released from jail.`);
  },
};