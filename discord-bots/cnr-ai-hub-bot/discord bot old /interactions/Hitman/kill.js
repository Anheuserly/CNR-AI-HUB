const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kill')
    .setDescription('Execute a hit on a marked target')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The target to kill')
        .setRequired(true)),
        
  async execute(interaction) {
    const hitmanRoleId = '1248697926515953694';
    const targetRoleId = '1265726365597044837';
    const deadRoleId = '1247164748278140978';

    const hitman = interaction.member;
    const target = interaction.options.getMember('target'); // The selected target

    // Check if the user is a hitman
    if (!hitman.roles.cache.has(hitmanRoleId)) {
      const unauthorizedMessage = new EmbedBuilder()
        .setTitle('🎯 Unauthorized Action')
        .setDescription(`You must be assigned as a hitman to use this command, ${hitman.user.username}.`)
        .setColor('Red');
      return interaction.reply({ embeds: [unauthorizedMessage], ephemeral: true });
    }

    // Check if the target has the target role
    if (!target.roles.cache.has(targetRoleId)) {
      const invalidTargetMessage = new EmbedBuilder()
        .setTitle('🎯 Invalid Target')
        .setDescription(`You can only kill targets with the ${interaction.guild.roles.cache.get(targetRoleId).name} role, ${hitman.user.username}.`)
        .setColor('Red');
      return interaction.reply({ embeds: [invalidTargetMessage], ephemeral: true });
    }

    // Execute the hit
    const payment = 3000; // Fixed payment of 3000 coins for the hit

    // Remove target role and add dead role
    await target.roles.remove(targetRoleId);
    await target.roles.add(deadRoleId);

    // Send DM to the target
    const targetDM = new EmbedBuilder()
      .setTitle('💀 You have been killed!')
      .setDescription(`You have been eliminated by a hitman.`)
      .setColor('Red');
    await target.send({ embeds: [targetDM] }).catch(() => console.log(`Couldn't send DM to ${target.user.tag}`));

    // Send DM to the hitman
    const hitmanDM = new EmbedBuilder()
      .setTitle('💰 Payment Received')
      .setDescription(`You have received payment of ${payment} coins for completing the contract.`)
      .setColor('Green');
    await hitman.send({ embeds: [hitmanDM] }).catch(() => console.log(`Couldn't send DM to ${hitman.user.tag}`));

    // Send message to the channel
    const killMessage = new EmbedBuilder()
      .setTitle('🎯 Contract Completed')
      .setDescription(`The contract to eliminate ${target} has been completed by ${hitman.user.username}.`)
      .setColor('Green');
    await interaction.reply({ embeds: [killMessage] });

    // Here you would typically add logic to transfer the payment to the hitman
    // This depends on how you've implemented your economy system
    // For example:
    // await transferPayment(hitman.id, payment);
  },
};
