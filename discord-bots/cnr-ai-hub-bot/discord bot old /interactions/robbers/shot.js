const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getOrCreateUserProfile } = require('../../utils/profileManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shot')
        .setDescription('Shoot another user with a weapon from your inventory')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to shoot')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('weapon')
                .setDescription('The weapon to use')
                .setRequired(true)),
    async execute(interaction) {
        const targetMember = interaction.options.getUser('target'); // Get the target user
        const weaponName = interaction.options.getString('weapon'); // Get the weapon name
        const member = interaction.member;

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

        // Fetch target member from guild
        const targetGuildMember = interaction.guild.members.cache.get(targetMember.id);

        // Ensure a target member is mentioned
        if (!targetGuildMember) {
            return interaction.reply({ content: 'Please mention a valid user to shoot.', ephemeral: true });
        }

        // Check if the member has an allowed role
        const hasAllowedRole = allowedRoles.some(roleId => member.roles.cache.has(roleId));
        if (!hasAllowedRole) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const userProfile = await getOrCreateUserProfile(member.id);
        const targetProfile = await getOrCreateUserProfile(targetGuildMember.id);

        // Check if both users are in the same interior
        const userInterior = getUserInterior(member);
        const targetInterior = getUserInterior(targetGuildMember);

        if (!userInterior || !targetInterior || userInterior.id !== targetInterior.id) {
            const embed = new EmbedBuilder()
                .setTitle('Invalid Location')
                .setDescription('Both users must be in the same interior to shoot.')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if the user has the weapon in their inventory
        const userWeapon = userProfile.inventory.find(item => item.name.toLowerCase() === weaponName.toLowerCase());

        if (!userWeapon) {
            const embed = new EmbedBuilder()
                .setTitle('Weapon Not Found')
                .setDescription('You do not have this weapon in your inventory.')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const weaponDamage = userWeapon.damage;

        // Check if the target is dead or jailed
        if (targetGuildMember.roles.cache.has(deadRoleId) || targetGuildMember.roles.cache.has(jailedRoleId)) {
            const embed = new EmbedBuilder()
                .setTitle('Invalid Target')
                .setDescription('You cannot shoot a dead or jailed user.')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const armorDamage = Math.min(targetProfile.armor, weaponDamage);
        const healthDamage = weaponDamage - armorDamage;

        // Update target profile
        targetProfile.armor -= armorDamage;
        targetProfile.health -= healthDamage;

        // Send initial embed messages for dramatic effect
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('You Take Aim')
                    .setDescription(`You carefully aim your **${userWeapon.name}** at ${targetGuildMember.user.username}.`)
                    .setColor('#00FF00'),
            ],
            ephemeral: false // You can adjust this based on your needs
        });

        setTimeout(async () => {
            await interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('You Fire')
                        .setDescription(`You pull the trigger, and a bullet flies towards ${targetGuildMember.user.username}.`)
                        .setColor('#00FF00'),
                ],
            });

            // Inform about armor damage
            if (armorDamage > 0) {
                await interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Armor Hit')
                            .setDescription(`${targetGuildMember.user.username}'s armor takes a hit, reducing its effectiveness.`)
                            .setColor('#FFFF00'),
                    ],
                });
            }

            // Inform about health damage
            if (healthDamage > 0) {
                await interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Painful Hit')
                            .setDescription(`${targetGuildMember.user.username} feels a surge of pain as the bullet hits them.`)
                            .setColor('#FF0000'),
                    ],
                });
            }

            // Check for armor break
            if (targetProfile.armor <= 0) {
                await interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Armor Shattered')
                            .setDescription(`${targetGuildMember.user.username}'s armor is shattered, leaving them vulnerable.`)
                            .setColor('#FF0000'),
                    ],
                });
            }

            // Check for health depletion
            if (targetProfile.health <= 0) {
                await interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Fatal Shot')
                            .setDescription(`${targetGuildMember.user.username} has been killed!`)
                            .setColor('#FF0000'),
                    ],
                });

                await targetGuildMember.roles.add(deadRoleId);
                // Implement clear weapons and inventory function here

                const incidentLocation = getIncidentLocation(interaction.channel.id);
                await member.roles.add(suspectRoleId);

                const notificationChannel = interaction.guild.channels.cache.get('1247240152598839439');
                const copRole = interaction.guild.roles.cache.get('1247162188913971272');
                const fbiRole = interaction.guild.roles.cache.get('1248949429713764353');

                const alertEmbed = new EmbedBuilder()
                    .setTitle('Murder Alert!')
                    .setColor('#FF0000')
                    .addFields(
                        { name: 'Victim', value: targetGuildMember.toString(), inline: true },
                        { name: 'Killer', value: member.toString(), inline: true },
                        { name: 'Location', value: incidentLocation, inline: true }
                    )
                    .setDescription(`**Warning!** A suspect has been identified: ${member.toString()} (${member.displayName}) in ${incidentLocation}. ${copRole.toString()} and ${fbiRole.toString()}, please investigate!`);

                await notificationChannel.send({ embeds: [alertEmbed] });
            } else {
                await interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Wounded')
                            .setDescription(`${targetGuildMember.user.username} is wounded but still alive.`)
                            .setColor('#FFFF00'),
                    ],
                });
            }

            await member.roles.add(suspectRoleId);

            const embedSuccess = new EmbedBuilder()
                .setTitle('Bullet Shot!')
                .setDescription(`**${interaction.user.toString()}** successfully damaged **${targetGuildMember.toString()}** with **${userWeapon.name}**!`)
                .setColor('#00FF00')
                .setFooter({ text: 'Stay safe and watch your back!', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp()
                .addFields(
                    { name: 'Damage Dealt', value: weaponDamage.toString(), inline: true },
                    { name: 'Target Health', value: targetProfile.health.toString(), inline: true },
                    { name: 'Target Armor', value: targetProfile.armor.toString(), inline: true }
                );

            await interaction.followUp({ embeds: [embedSuccess] });
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
