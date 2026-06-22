const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'quit',
    description: 'Leave the game and remove all game-related roles',
    async execute(message, args) {
        const member = message.member;

        // Role IDs
        const roleIds = {
            cop: '1247162188913971272',
            robber: '1248188281976389689',
            fbi: '1248949429713764353',
            hitman: '1248697926515953694',
            suspected: '1247162056793391175',
            
             // Location roles
            inBank: '1247197700051701842',
            inAmmunation: '1247197731475161198',
            inItemShop: '1247197782146678804',
            inRestraunt: '1291385987091402834',

             // Weapon roles
             berretaM19: '1249710336710283345',
             desertEagle: '1249710117633527838',
             remington870: '1249710331513671690',
             glock17: '1249709988503617586',
             mossberg500: '1249710332109262868'

           
        };

        const rolesToRemove = Object.values(roleIds).filter(roleId => 
            member.roles.cache.has(roleId)
        );

        if (rolesToRemove.length > 0) {
            try {
                await member.roles.remove(rolesToRemove);

                const embed = new EmbedBuilder()
                    .setTitle('Left the Game')
                    .setDescription(`${message.author.username} has left the game.`)
                    .setColor('#00FF00');

                await message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error removing roles:', error);
                await message.reply('An error occurred while trying to leave the game.');
            }
        } else {
            const embed = new EmbedBuilder()
                .setTitle('Not in Mode')
                .setDescription(`${message.author.username} is not in any mode.`)
                .setColor('#FF0000');

            await message.reply({ embeds: [embed] });
        }
    },
};

