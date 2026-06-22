const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gameinfo')
        .setDescription('Get information about roles and game rules.'),
    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Game Information: Cops and Robbers')
            .setDescription('Learn about the roles and rules of the game.');

        // Cop role details
        embed.addFields([
            {
                name: 'Cop Role',
                value: 
                    'Join as a Cop and maintain law and order. Your job is to catch Robbers and prevent crimes.\n' +
                    '**Commands:**\n' +
                    '`copjoin` - Join as a Cop.\n' +
                    '`patrol` - Patrol the streets to find Robbers.\n' +
                    '`arrest` - Arrest a caught Robber.\n' +
                    '`investigate` - Investigate a suspicious area.\n' +
                    '`backup` - Call for backup from other Cops.\n\n' +
                    '**Cop Rules:**\n' +
                    '1. Protect the city from Robbers.\n' +
                    '2. Work with other Cops to maintain order.\n' +
                    '3. Use your resources wisely to catch criminals.\n\n' +
                    '**Story:**\n' +
                    'You are a dedicated officer of the law, committed to keeping the streets safe. Use your training and instincts to bring justice and order to the city.',
                inline: false
            },
            {
                name: 'Robber Role',
                value: 
                    'Join as a Robber and commit crimes while evading Cops. Your job is to outsmart the Cops and make a fortune.\n' +
                    '**Commands:**\n' +
                    '`robberjoin` - Join as a Robber.\n' +
                    '`bankrob` - Attempt to rob the bank.\n' +
                    '`ammurob` - Steal ammunition from the armory.\n' +
                    '`itemshop` - Purchase items from the black market.\n' +
                    '`rob` - Rob other players.\n\n' +
                    '**Robber Rules:**\n' +
                    '1. Avoid getting caught by Cops.\n' +
                    '2. Plan your heists carefully.\n' +
                    '3. Work with other Robbers for bigger scores.\n\n' +
                    '**Story:**\n' +
                    'You are a cunning and daring outlaw, always on the lookout for the next big heist. Use your skills and resources to outsmart the Cops and make a fortune!',
                inline: false
            },
            {
                name: 'FBI Role',
                value: 
                    'Join as an FBI agent and take on high-profile cases. Your job is to handle major crimes and assist local law enforcement.\n' +
                    '**Commands:**\n' +
                    '`fbijoin` - Join as an FBI agent.\n' +
                    '`taze` - Taze a suspect to incapacitate them.\n' +
                    '`raid` - Conduct a raid on a suspected criminal hideout.\n' +
                    '`wiretap` - Set up surveillance on a suspect.\n' +
                    '`interrogate` - Question a captured suspect.\n\n' +
                    '**FBI Rules:**\n' +
                    '1. Handle major crimes and assist local law enforcement.\n' +
                    '2. Coordinate with other agencies for maximum effectiveness.\n' +
                    '3. Use advanced technology and resources to solve cases.\n\n' +
                    '**Story:**\n' +
                    'As an elite FBI agent, you\'re tasked with solving the most challenging cases. Use your expertise and resources to bring down organized crime and protect national security.',
                inline: false
            },
            {
                name: 'Hitman Role',
                value: 
                    'Join as a Hitman and carry out contracts in the criminal underworld. Your job is to eliminate targets while avoiding detection.\n' +
                    '**Commands:**\n' +
                    '`hitmanjoin` - Join as a Hitman.\n' +
                    '`kill` - Attempt to eliminate a target.\n' +
                    '`disguise` - Change your appearance to avoid detection.\n' +
                    '`recon` - Gather intelligence on a target.\n' +
                    '`escape` - Attempt to escape from a compromised situation.\n\n' +
                    '**Hitman Rules:**\n' +
                    '1. Complete contracts without getting caught.\n' +
                    '2. Maintain a low profile and avoid unnecessary casualties.\n' +
                    '3. Use stealth and strategy to accomplish your missions.\n\n' +
                    '**Story:**\n' +
                    'As a skilled and elusive hitman, you operate in the shadows of the criminal underworld. Your reputation for efficiency and discretion keeps you in high demand among those seeking your lethal services.',
                inline: false
            },
        ]);

        // Interiors information
        embed.addField('Interiors', 
            'Explore various interiors in the game that offer unique experiences:\n' +
            '- **Ammunation:** Purchase weapons and ammunition.\n' +
            '- **Bank:** Attempt to rob or safeguard money.\n' +
            '- **Item Shop:** Buy and sell items to aid in your quests.\n' +
            '- **Casino:** Try your luck at games or rob it.\n' +
            '- **Restaurant:** Gather intel or relax with friends.\n', 
            false);

        await interaction.reply({ embeds: [embed] });
    },
};
