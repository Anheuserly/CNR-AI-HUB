const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createTicket } = require('../../handlers/ticketHandler');

module.exports = {
    name: 'createticket',
    async execute(client, reaction, user) {
        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        const category = client.channels.cache.get('1248979424070602783');
        const ticketLogChannel = client.channels.cache.get('1248979912941899797');

        const ticketChannel = await guild.channels.create({
            name: `ticket-${member.user.username}`,
            type: 0, // GUILD_TEXT
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: member.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: '1248983568122777632', // Replace with your staff role ID
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ],
        });

        const embed = new EmbedBuilder()
            .setTitle('New Ticket Created')
            .setDescription(`Hello ${member}, please describe your issue in detail. A staff member will assist you shortly.`)
            .setColor('Green');

        await ticketChannel.send({ embeds: [embed] });

        const logEmbed = new EmbedBuilder()
            .setTitle('New Ticket Created')
            .setDescription(`${member} created a new ticket: ${ticketChannel}`)
            .setColor('Green');

        await ticketLogChannel.send({ embeds: [logEmbed] });
    },
};