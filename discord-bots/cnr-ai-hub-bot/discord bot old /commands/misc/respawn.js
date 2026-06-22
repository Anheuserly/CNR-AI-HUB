const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'respawn',
    description: 'Respawn after death.',
    async execute(message, args) {
        const deadRoleId = '1247164748278140978';

        // Check if the user has the dead role
        if (!message.member.roles.cache.has(deadRoleId)) {
            await message.reply("⛔ You are not dead. You cannot use this command.");
            return;
        }

        await message.reply("You are dead. Waiting for respawn...");

        // First message (1 second after death)
        await new Promise(resolve => setTimeout(resolve, 1000));
        let embed = new EmbedBuilder()
            .setTitle("Knocked Down")
            .setDescription("You are knocked down and bleeding! Emergency is coming.")
            .setColor("#FF0000");
        await message.channel.send({ embeds: [embed] });

        // Ambulance arrives (30 seconds after death)
        await new Promise(resolve => setTimeout(resolve, 30000));
        embed = new EmbedBuilder()
            .setTitle("Ambulance Arrives")
            .setDescription("The ambulance has arrived. Paramedics are trying to stabilize you.")
            .setColor("#FFFF00");
        await message.channel.send({ embeds: [embed] });

        // Paramedics try to revive (30 seconds after ambulance arrival)
        await new Promise(resolve => setTimeout(resolve, 30000));
        embed = new EmbedBuilder()
            .setTitle("Revival Attempt")
            .setDescription("Paramedics are trying to give you injections and perform electric shock in the vehicle.")
            .setColor("#FFFF00");
        await message.channel.send({ embeds: [embed] });

        // Arrive at hospital (1 minute after death)
        await new Promise(resolve => setTimeout(resolve, 60000));
        embed = new EmbedBuilder()
            .setTitle("Arrival at Hospital")
            .setDescription("You have arrived at the hospital. Doctors are preparing to take you to the operation theater.")
            .setColor("#00FF00");
        await message.channel.send({ embeds: [embed] });

        // Operation theater (30 seconds after arrival)
        await new Promise(resolve => setTimeout(resolve, 30000));
        embed = new EmbedBuilder()
            .setTitle("Operation Theater")
            .setDescription("You are being taken to the operation theater. Doctors are preparing to operate on you.")
            .setColor("#00FF00");
        await message.channel.send({ embeds: [embed] });

        // Notify about full recovery (90 seconds after operation)
        await new Promise(resolve => setTimeout(resolve, 90000));
        embed = new EmbedBuilder()
            .setTitle("Full Recovery")
            .setDescription("You have fully recovered from your injuries.")
            .setColor("#00FF00");
        await message.channel.send({ embeds: [embed] });

        // Revoke dead role
        const deadRole = message.guild.roles.cache.get(deadRoleId);
        if (deadRole) {
            await message.member.roles.remove(deadRole);
        }
    },
};
