const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'bc',
    description: 'Attempt to break cuffs',
    async execute(message, args) {
        const cuffedRoleId = '1263908645763158157';
        const suspendedRoleId = '1256846908291289171';
        const copRoleId = '1247162188913971272';
        const fbiRoleId = '1248949429713764353';
        const alertChannelId = '1247240152598839439';

        const member = message.member;
        const guild = message.guild;

        if (!member.roles.cache.has(cuffedRoleId)) {
            const embed = new EmbedBuilder()
                .setTitle("You are not cuffed")
                .setDescription(`You can't break cuffs because you are not cuffed, ${message.author.username}.`)
                .setColor("#FF0000");
            await message.reply({ embeds: [embed] });
            return;
        }

        const successChance = 20; // 20% chance of success
        const success = Math.random() * 100 <= successChance;

        if (success) {
            await member.roles.remove(cuffedRoleId);
            await member.roles.add(suspendedRoleId);

            const breakCuffEmbed = new EmbedBuilder()
                .setTitle("You Broke the Cuffs")
                .setDescription(`You have broken the cuffs and are now suspended, ${message.author.username}.`)
                .setColor("#00FF00");

            await message.reply({ embeds: [breakCuffEmbed] });

            const alertChannel = await guild.channels.fetch(alertChannelId);
            const alertEmbed = new EmbedBuilder()
                .setTitle("Suspect on the Loose!")
                .setDescription(`**ALERT** ${message.author.username} has just broken their cuffs and escaped! All <@&${copRoleId}> and <@&${fbiRoleId}>, please take immediate action to apprehend the suspect.`)
                .setColor("#FF0000");

            await alertChannel.send({ embeds: [alertEmbed] });
        } else {
            const failEmbed = new EmbedBuilder()
                .setTitle("Failed to Break the Cuffs")
                .setDescription(`You failed to break the cuffs, ${message.author.username}. You're still cuffed.`)
                .setColor("#FF0000");

            await message.reply({ embeds: [failEmbed] });
        }
    },
};