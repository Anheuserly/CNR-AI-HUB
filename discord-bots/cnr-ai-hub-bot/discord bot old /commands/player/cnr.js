const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const gameRoles = ['1247162188913971272', '1248949429713764353', '1248697926515953694', '1248188281976389689'];
const requiredRoles = {
  'fbi': '1292564394663874650', 
  'hitman': '1292564456928186479'
};

const weaponRoles = {
  'Berreta M19': '1249710336710283345',
  'Desert Eagle': '1249710117633527838',
  'Remington 870': '1249710331513671690',
  'Glock 17': '1249709988503617586',
  'Mossberg 500': '1249710332109262868'
};

const spawnLoadouts = {
  'robber': {
    health: 100,
    armorHealth: 100,
    items: []
  },
  'hitman': {
    health: 200,
    armorHealth: 100,
    items: [
      { name: 'Armor', type: 'armor' },
      { name: 'Glock 17', type: 'weapon' },
      { name: 'Mossberg 500', type: 'weapon' }
    ]
  },
  'cop': {
    health: 100,
    armorHealth: 100,
    items: [
      { name: 'Berreta M19', type: 'weapon' }
    ]
  },
  'fbi': {
    health: 200,
    armorHealth: 100,
    items: [
      { name: 'Armor', type: 'armor' },
      { name: 'Desert Eagle', type: 'weapon' },
      { name: 'Remington 870', type: 'weapon' }
    ]
  }
};

function loadProfile(userId) {
  const filePath = path.join(__dirname, '..', '..', '..', 'savedata', `${userId}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

function saveProfile(profile) {
  const filePath = path.join(__dirname, '..', '..', '..', 'savedata', `${profile.userId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
}

module.exports = {
  name: 'cnr',
  description: 'Join the Cops and Robbers game',
  async execute(message) {
    const member = message.member;

    if (member.roles.cache.some(role => gameRoles.includes(role.id))) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(`${message.author}, you are already in the game!`)
        .setColor('#FF0000');
      await message.reply({ embeds: [errorEmbed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(':man_police_officer: Choose Your Duty :man_detective:')
      .setDescription('Select the duty you want to join.')
      .setColor('#0000FF');

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('fbi')
          .setLabel('FBI')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('hitman')
          .setLabel('Hitman')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('cop')
          .setLabel('Cop')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('robber')
          .setLabel('Robber')
          .setStyle(ButtonStyle.Primary)
      );

    const response = await message.reply({ embeds: [embed], components: [row] });
    const filter = i => i.user.id === message.author.id;
    const collector = response.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      const roleMapping = {
        'fbi': '1248949429713764353',
        'hitman': '1248697926515953694',
        'cop': '1247162188913971272',
        'robber': '1248188281976389689'
      };

      const roleId = roleMapping[i.customId];
      const role = message.guild.roles.cache.get(roleId);

      if ((i.customId === 'fbi' || i.customId === 'hitman')) {
        const requiredRoleId = requiredRoles[i.customId];
        if (!member.roles.cache.has(requiredRoleId)) {
            await i.reply({ 
                content: `You need the required role to join as ${i.customId.toUpperCase()}.`, 
                ephemeral: true 
            });
            return;
        }
    }

      if (role) {
        await member.roles.add(role);
        
        // Add weapon roles based on loadout
        const loadout = spawnLoadouts[i.customId];
        for (const item of loadout.items) {
          if (item.type === 'weapon' && weaponRoles[item.name]) {
            const weaponRole = message.guild.roles.cache.get(weaponRoles[item.name]);
            if (weaponRole) {
              await member.roles.add(weaponRole);
            }
          }
        }
        
        let profile = loadProfile(member.id);
        
        if (!profile) {
          profile = {
            userId: member.id,
            health: loadout.health,
            maxHealth: loadout.health,
            armorHealth: loadout.armorHealth,
            inventory: loadout.items,
            xp: 0,
            currency: 0,
            level: 1,
            experience: 0,
            markedMoney: 0,
            lastDailyClaim: null,
            isDead: false
          };
        } else {
          profile.health = loadout.health;
          profile.maxHealth = loadout.health;
          profile.armorHealth = loadout.armorHealth;
          profile.inventory = loadout.items;
        }
        
        saveProfile(profile);

        const successEmbed = new EmbedBuilder()
          .setTitle('Role Assignment Success')
          .setDescription(`You've joined as ${i.customId.toUpperCase()}`)
          .addFields(
            { name: 'Health', value: `${loadout.health}/${loadout.health}`, inline: true },
            { name: 'Armor Health', value: `${loadout.armorHealth}`, inline: true },
            { name: 'Starting Items', value: loadout.items.length > 0 ? loadout.items.map(item => item.name).join(', ') : 'None' }
          )
          .setColor('#00FF00');

        await i.update({ embeds: [successEmbed], components: [] });
      } else {
        await i.update({ content: 'Role not found!', components: [] });
      }
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        await message.channel.send({ content: 'No selection was made.', ephemeral: true });
      }
    });
  },
};