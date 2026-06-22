const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'commands',
    description: 'Displays a stylish list of all available commands.',
    execute(message) {
        const commandsEmbed = new EmbedBuilder()
            .setTitle('🌟 **Available Commands** 🌟')
            .setColor('#2F3136') // Dark color for a modern look
            .setThumbnail('https://example.com/thumbnail.png') // Add your bot's thumbnail or logo
            .setDescription('Here is the list of commands you can use! Use `!command_name` for more details on each command.')
            .addFields(
                { name: '**Cops**', value: '🔒 **Arrest**\n🔒 **Cuff**\n🔒 **Jail**', inline: true },
                { name: '**FBI**', value: '🔦 **Taze**', inline: true },
                { name: '**Hitman**', value: '🔪 **Kill**', inline: true },
                { name: '**Robber**', value: '💰 **Ammurob**\n💰 **Bankrob**\n💰 **Itemshoprob**\n💰 **Breakcuff**\n💰 **Dealership**\n💰 **Pain**\n💰 **Plantc4**\n💰 **Shot**\n💰 **Rob**', inline: true },
                { name: '**Giveaway**', value: '🎉 **Giveaway**', inline: true },
                { name: '**Health**', value: '🩺 **Buyarmor**\n🩺 **Buyhealth**\n🩺 **Myhealth**', inline: true },
                { name: '**Interior**', value: '🏢 **Ammunition**\n🏢 **Bank**\n🏢 **Blackmarket**\n🏢 **Itemshop**\n🏢 **Ammunationexit**\n🏢 **Bankexit**\n🏢 **Blackmarketexit**\n🏢 **Itemshopexit**', inline: true },
                { name: '**Inventory**', value: '📦 **Balance**\n📦 **Daily**\n📦 **Earn**\n📦 **Give**\n📦 **Itemshop**\n📦 **Luckyspin**\n📦 **Profile**\n📦 **Register**\n📦 **Work**', inline: true },
                { name: '**Misc**', value: '🔄 **Respawn**', inline: true },
                { name: '**Moderation**', value: '👮 **Anhemode**\n👮 **Aprelmode**\n👮 **Cban**\n👮 **Cmute**\n👮 **Csuspend**\n👮 **Cunban**\n👮 **Cunmute**\n👮 **Cunsuspend**\n👮 **Moderatorduty**\n👮 **Supervisorduty**', inline: true },
                { name: '**Music**', value: '🎵 **Pause**\n🎵 **Play**\n🎵 **Queue**\n🎵 **Skip**\n🎵 **Stop**\n🎵 **Volume**', inline: true },
                { name: '**Player**', value: '🧑 **Cnr**\n🧑 **Ping**\n🧑 **Quit**\n🧑 **Stats**\n🧑 **Weap**', inline: true },
                { name: '**Ticket**', value: '🎫 **Setup**\n🎫 **Create**\n🎫 **Close**', inline: true },
            )
            .setFooter({ text: 'Need help? Type !help or reach out to a moderator!', iconURL: 'https://example.com/footer-icon.png' }) // Add a footer icon
            .setTimestamp();

        message.reply({ embeds: [commandsEmbed] });
    },
};
