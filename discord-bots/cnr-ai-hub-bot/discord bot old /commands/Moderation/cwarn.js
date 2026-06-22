const { PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    name: 'cwarn',
    description: 'Warn a user in CNR channels',
    async execute(message, args) {
        // Check if the user has the necessary permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply("You don't have permission to use this command.");
        }

        // Check if a user and reason were provided
        const target = message.mentions.members.first(); // Mentioned user
        const reason = args.slice(1).join(' ') || 'No reason provided'; // Reason after user mention

        if (!target) {
            return message.reply('Please mention a valid user to warn.');
        }

        try {
            // Create and send an embed message in the channel
            const embed = new EmbedBuilder()
                .setTitle('User Warned in CNR Channels')
                .setDescription(`${target.displayName} has been warned.`)
                .addFields({ name: 'Reason', value: reason })
                .setColor(Colors.Yellow);

            await message.channel.send({ embeds: [embed] });

            // Send a DM to the warned user
            const dmEmbed = new EmbedBuilder()
                .setTitle('You Have Been Warned in CNR Channels')
                .setDescription(`You have been warned for the following reason: ${reason}`)
                .setColor(Colors.Red);

            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.error(error);
            message.reply('Failed to warn the user or send a DM. Please check my permissions.');
        }
    },
};
