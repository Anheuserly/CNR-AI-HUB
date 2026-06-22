const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateUserProfile, saveUserProfile } = require('../../utils/profileManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pain')
        .setDescription('Attack a user with a knife')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to attack')
                .setRequired(true)),
        
    async execute(interaction) {
        const member = interaction.member;
        const targetMember = interaction.options.getMember('target');
        
        // Role IDs
        const deadRoleId = '1247164748278140978';
        const jailedRoleId = '1247170843616874518';
        const robberRoleId = '1248188281976389689';
        const copRoleId = '1247162188913971272';
        const shieldRoleId = '1262461647491043471';

        // New game mode restriction roles
        const restrictedRoleIDs = [
            '1248949429713764353', // FBI
            '1247162188913971272', // Cop
            '1248697926515953694', // Hitman
            '1248188281976389689', // Robber
        ];

        // Check if the user is in game mode
        const isInGameMode = member.roles.cache.some(role => restrictedRoleIDs.includes(role.id));

        if (!isInGameMode) {
            return interaction.reply('You are not in game mode. Please acquire a valid role to perform this action.');
        }

        if (member.roles.cache.has(deadRoleId) || member.roles.cache.has(jailedRoleId)) {
            return interaction.reply('You cannot use this command while dead or jailed.');
        }

        if (!member.roles.cache.has(robberRoleId)) {
            return interaction.reply('Only robbers can use this command.');
        }

        if (member.roles.cache.has(copRoleId)) {
            return interaction.reply("Cops can't use knife attacks.");
        }

        const userProfile = await getOrCreateUserProfile(member.id); // User executing the command
        const targetProfile = await getOrCreateUserProfile(targetMember.id); // Target user profile
        const damageDealt = 100;

        // Check if the user has a knife in their inventory
        if (!userProfile.inventory.includes('knife')) {
            return interaction.reply('You do not have a knife in your inventory.');
        }

        // Shield check
        if (targetMember.roles.cache.has(shieldRoleId)) {
            const shieldProfile = await getOrCreateUserProfile(targetMember.id);
            if (shieldProfile.shieldAttempts > 0) {
                shieldProfile.shieldAttempts--;
                await saveUserProfile(targetMember.id, shieldProfile);
                return interaction.reply(`${targetMember.user.username} has a shield with ${shieldProfile.shieldAttempts} attempts left.`);
            } else {
                await targetMember.roles.remove(shieldRoleId);
            }
        }

        // Apply damage
        targetProfile.health -= damageDealt;

        if (targetProfile.health <= 0) {
            await targetMember.roles.add(deadRoleId);
            await interaction.reply(`${targetMember.user.username} has been killed!`);
        }

        // Embed response
        const embed = new EmbedBuilder()
            .setTitle('Knife Attack!')
            .setDescription(`You attacked ${targetMember.user.username} with a knife!`)
            .setColor('#FF0000')
            .addFields(
                { name: 'Damage Dealt', value: damageDealt.toString(), inline: true },
                { name: 'Target Health', value: targetProfile.health.toString(), inline: true }
            );

        await interaction.reply({ embeds: [embed] });
        
        // Update the target profile after the attack
        await saveUserProfile(targetMember.id, targetProfile);
    },
};
