const { EmbedBuilder } = require('discord.js');
const { getOrCreateUserProfile } = require('../../utils/profileManager');

module.exports = {
    name: 'shot',
    description: 'Shoot another user with a weapon from your inventory',

    async execute(message, args) {
        const targetMember = message.mentions.members.first(); // Get the target user
        const weaponName = args.slice(1).join(' '); // Get the weapon name (everything after the mention)
        const member = message.member;

        // Role IDs
        const allowedRoles = [
            '1247162188913971272', // Cop
            '1248949429713764353', // FBI
            '1248697926515953694', // Hitman
            '1248188281976389689'  // Robber
        ];
        const deadRoleId = '1247164748278140978';
        const jailedRoleId = '1247170843616874518';
        const suspectRoleId = '1247162056793391175';

        // Ensure a target member is mentioned
        if (!targetMember) {
            return message.reply('Please mention a valid user to shoot.');
        }

        // Check if the member has an allowed role
        const hasAllowedRole = allowedRoles.some(roleId => member.roles.cache.has(roleId));
        if (!hasAllowedRole) {
            return message.reply('You do not have permission to use this command.');
        }

        const userProfile = await getOrCreateUserProfile(member.id);
        const targetProfile = await getOrCreateUserProfile(targetMember.id);

        // Check if both users are in the same interior
        const userInterior = getUserInterior(member);
        const targetInterior = getUserInterior(targetMember);

        if (!userInterior || !targetInterior || userInterior.id !== targetInterior.id) {
            const embed = new EmbedBuilder()
                .setTitle('Invalid Location')
                .setDescription('Both users must be in the same interior to shoot.')
                .setColor('#FF0000');
            return message.channel.send({ embeds: [embed] });
        }

        // Check if the user has the weapon in their inventory
        const userWeapon = userProfile.inventory.find(item => item.name.toLowerCase() === weaponName.toLowerCase());

        if (!userWeapon) {
            const embed = new EmbedBuilder()
                .setTitle('Weapon Not Found')
                .setDescription('You do not have this weapon in your inventory.')
                .setColor('#FF0000');
            return message.channel.send({ embeds: [embed] });
        }

        const weaponDamage = userWeapon.damage;

        // Check if the target is dead or jailed
        if (targetMember.roles.cache.has(deadRoleId) || targetMember.roles.cache.has(jailedRoleId)) {
            const embed = new EmbedBuilder()
                .setTitle('Invalid Target')
                .setDescription('You cannot shoot a dead or jailed user.')
                .setColor('#FF0000');
            return message.channel.send({ embeds: [embed] });
        }

        const armorDamage = Math.min(targetProfile.armor, weaponDamage);
        const healthDamage = weaponDamage - armorDamage;

        // Update target profile
        targetProfile.armor -= armorDamage;
        targetProfile.health -= healthDamage;

        // Send initial embed messages for dramatic effect
        await message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle('You Take Aim')
                    .setDescription(`You carefully aim your **${userWeapon.name}** at ${targetMember.user.username}.`)
                    .setColor('#00FF00'),
            ],
        });

        setTimeout(async () => {
            await message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('You Fire')
                        .setDescription(`You pull the trigger, and a bullet flies towards ${targetMember.user.username}.`)
                        .setColor('#00FF00'),
                ],
            });

            // Inform about armor damage
            if (armorDamage > 0) {
                await message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Armor Hit')
                            .setDescription(`${targetMember.user.username}'s armor takes a hit, reducing its effectiveness.`)
                            .setColor('#FFFF00'),
                    ],
                });
            }

            // Inform about health damage
            if (healthDamage > 0) {
                await message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Painful Hit')
                            .setDescription(`${targetMember.user.username} feels a surge of pain as the bullet hits them.`)
                            .setColor('#FF0000'),
                    ],
                });
            }

            // Check for armor break
            if (targetProfile.armor <= 0) {
                await message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Armor Shattered')
                            .setDescription(`${targetMember.user.username}'s armor is shattered, leaving them vulnerable.`)
                            .setColor('#FF0000'),
                    ],
                });
            }

            // Check for health depletion
            if (targetProfile.health <= 0) {
                await message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Fatal Shot')
                            .setDescription(`${targetMember.user.username} has been killed!`)
                            .setColor('#FF0000'),
                    ],
                });

                await targetMember.roles.add(deadRoleId);
                // Implement clear weapons and inventory function here

                const incidentLocation = getIncidentLocation(message.channel.id);
                await member.roles.add(suspectRoleId);

                const notificationChannel = message.guild.channels.cache.get('1247240152598839439');
                const copRole = message.guild.roles.cache.get('1247162188913971272');
                const fbiRole = message.guild.roles.cache.get('1248949429713764353');

                const alertEmbed = new EmbedBuilder()
                    .setTitle('Murder Alert!')
                    .setColor('#FF0000')
                    .addFields(
                        { name: 'Victim', value: targetMember.toString(), inline: true },
                        { name: 'Killer', value: member.toString(), inline: true },
                        { name: 'Location', value: incidentLocation, inline: true }
                    )
                    .setDescription(`**Warning!** A suspect has been identified: ${member.toString()} (${member.displayName}) in ${incidentLocation}. ${copRole.toString()} and ${fbiRole.toString()}, please investigate!`);

                await notificationChannel.send({ embeds: [alertEmbed] });
            } else {
                await message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Wounded')
                            .setDescription(`${targetMember.user.username} is wounded but still alive.`)
                            .setColor('#FFFF00'),
                    ],
                });
            }

            await member.roles.add(suspectRoleId);

            const embedSuccess = new EmbedBuilder()
                .setTitle('Bullet Shot!')
                .setDescription(`**${message.author.toString()}** successfully damaged **${targetMember.toString()}** with **${userWeapon.name}**!`)
                .setColor('#00FF00')
                .setFooter({ text: 'Stay safe and watch your back!', iconURL: message.client.user.displayAvatarURL() })
                .setTimestamp()
                .addFields(
                    { name: 'Damage Dealt', value: weaponDamage.toString(), inline: true },
                    { name: 'Target Health', value: targetProfile.health.toString(), inline: true },
                    { name: 'Target Armor', value: targetProfile.armor.toString(), inline: true }
                );

            await message.channel.send({ embeds: [embedSuccess] });
        }, 1000);
    },
};

// Utility Functions
function getUserInterior(member) {
    const interiorRoles = [
        '1247197700051701842',
        '1247197731475161198',
        '1247197782146678804',
        '1248188152997478450'
    ];
    for (const roleId of interiorRoles) {
        if (member.roles.cache.has(roleId)) {
            return member.guild.roles.cache.get(roleId);
        }
    }
    return null;
}

function getIncidentLocation(channelId) {
    const locationMapping = {
        'channel_id_1': 'Location A',
        'channel_id_2': 'Location B',
    };
    return locationMapping[channelId] || 'Unknown Location';
}
