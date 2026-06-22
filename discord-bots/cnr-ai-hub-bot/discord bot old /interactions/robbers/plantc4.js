const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plantc4')
        .setDescription('Plant a C4 explosive'),
        
    async execute(interaction) {
        const member = interaction.member;

        // Role IDs
        const roles = {
            robber: '1248188281976389689',
            dead: '1247164748278140978',
            cop: '1247162188913971272',
            suspect: '1247162056793391175',
        };

        // Role checks
        if (!member.roles.cache.has(roles.robber)) {
            return interaction.reply('Only robbers can use this command.');
        }

        if (member.roles.cache.has(roles.dead)) {
            return interaction.reply('You are not allowed to use this command.');
        }

        if (member.roles.cache.has(roles.cop)) {
            return interaction.reply("Cops can't use C4 Bombs.");
        }

        // Add the suspect role
        await member.roles.add(roles.suspect);

        // Determine the interior location based on roles
        const interiors = {
            '1247197700051701842': 'Bank',
            '1247197731475161198': 'Ammunation',
            '1247197782146678804': 'Item Shop',
            '1248188152997478450': 'Black Market',
        };

        let interiorName = Object.entries(interiors).find(([id]) => member.roles.cache.has(id))?.[1];
        if (!interiorName) {
            return interaction.reply('You are not in a valid interior.');
        }

        // Embed message for planting C4
        const embedMessage = new EmbedBuilder()
            .setTitle('You planted a C4 explosive!')
            .setDescription(`This command was executed by ${interaction.user.username}. It will detonate in 30 seconds.`)
            .setColor('#8B0000')
            .setImage('https://tenor.com/view/csgo-bomb-animation-csgo.gif');

        await interaction.reply({ embeds: [embedMessage] });
        await interaction.channel.send(`EVERYONE RUN FROM THE ${interiorName} OR EVERYONE GONNA DIE IN 30 SECONDS!`);

        // Detonation logic after 30 seconds
        setTimeout(async () => {
            const membersInInterior = interaction.guild.members.cache.filter(m =>
                m.roles.cache.has(Object.keys(interiors).find(id => member.roles.cache.has(id))) && m.id !== member.id
            );

            for (const targetMember of membersInInterior.values()) {
                await targetMember.roles.add(roles.dead);
                await interaction.channel.send(`${targetMember.user.username} is caught in the explosion and is now dead!`);
            }

            // Embed message for detonation
            const detonateMessage = new EmbedBuilder()
                .setTitle('BOOM!')
                .setDescription('The C4 explosive has detonated!')
                .setColor('#8B0000')
                .setImage('https://tenor.com/view/explosion-boom.gif');

            await interaction.channel.send({ embeds: [detonateMessage] });
        }, 30000);
    },
};
