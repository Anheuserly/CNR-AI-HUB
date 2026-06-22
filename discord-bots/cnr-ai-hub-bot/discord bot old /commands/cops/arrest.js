const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'arrest',
  description: 'Arrest a cuffed suspect',
  async execute(message, args) {
    const copRoleId = '1247162188913971272';
    const suspectRoleId = '1247162056793391175';
    const cuffedRoleId = '1263908645763158157';
    const jailedRoleId = '1247170843616874518';
    const deadRoleId = '1247164748278140978';

    const member = message.member;
    const suspect = message.mentions.members.first(); // Get the mentioned member (suspect)

    // Check if the cop mentioned a suspect
    if (!suspect) {
      return message.reply('❌ You need to mention a suspect to arrest.');
    }

    // Check if the user is a cop
    if (!member.roles.cache.has(copRoleId)) {
      return message.reply('❌ You are not assigned as a cop to arrest someone. Use `/copduty` to get assigned.');
    }

    // Check if the suspect is cuffed
    if (!suspect.roles.cache.has(cuffedRoleId)) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Cannot arrest')
        .setDescription(`You can only arrest a cuffed suspect. ${suspect.displayName} is not cuffed.`)
        .setColor('Red');
      return message.channel.send({ embeds: [embed] });
    }

    // Check if the suspect is already jailed or dead
    if (suspect.roles.cache.has(jailedRoleId) || suspect.roles.cache.has(deadRoleId)) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Cannot arrest')
        .setDescription(`You can't arrest ${suspect.displayName} because they are already jailed or dead.`)
        .setColor('Red');
      return message.channel.send({ embeds: [embed] });
    }

    // Perform the arrest
    await suspect.roles.remove(cuffedRoleId);
    await suspect.roles.remove(suspectRoleId);
    await suspect.roles.add(jailedRoleId);

    const arrestEmbed = new EmbedBuilder()
      .setTitle('🚔 Suspect Arrested')
      .setDescription(`${member.displayName} has arrested ${suspect.displayName}. They will be jailed for 5 minutes.`)
      .setColor('Blue');

    await message.channel.send({ embeds: [arrestEmbed] });

    // Jail timer
    for (let i = 5; i > 0; i--) {
      await new Promise(resolve => setTimeout(resolve, 60000)); // wait 1 minute
      await suspect.send(`${i} minute(s) left in jail!`);
    }

    // Release from jail
    await suspect.roles.remove(jailedRoleId);
    
    const releaseEmbed = new EmbedBuilder()
      .setTitle('🔓 Suspect Released')
      .setDescription(`${suspect.displayName} has been released from jail.`)
      .setColor('Green');

    await message.channel.send({ embeds: [releaseEmbed] });
  },
};
