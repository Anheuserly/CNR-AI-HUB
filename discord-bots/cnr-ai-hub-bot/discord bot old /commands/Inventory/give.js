const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');

module.exports = {
    name: 'give', // Command name
    description: '💸 Give currency to another user.', // Command description
    async execute(message, args) {
        if (args.length < 2) {
            await message.reply("⚠️ Please provide a recipient and an amount.");
            return;
        }

        // Extract recipient and amount from the arguments
        const recipientMention = args[0];
        const amount = parseInt(args[1], 10);

        // Check if recipient mention is valid
        const recipient = message.mentions.users.first() || message.guild.members.cache.get(recipientMention.replace(/[<@!>]/g, ''));
        
        if (!recipient) {
            await message.reply("⚠️ Please mention a valid user.");
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            await message.reply("⚠️ Amount must be a positive number.");
            return;
        }

        const senderProfile = await getOrCreateUserProfile(message.author.id);
        const recipientProfile = await getOrCreateUserProfile(recipient.id);

        if (senderProfile.currency < amount) {
            await message.reply("⛔ You don't have enough currency.");
            return;
        }

        senderProfile.currency -= amount; // Deduct from sender
        recipientProfile.currency += amount; // Add to recipient

        await saveUserProfile(message.author.id, senderProfile);
        await saveUserProfile(recipient.id, recipientProfile);

        await message.reply({
            embeds: [{
                title: "💸 Currency Given",
                description: `${message.author.username} gave ${amount} currency to ${recipient.username}.`,
                color: 0x00FF00 // Green color
            }]
        });
    },
};
