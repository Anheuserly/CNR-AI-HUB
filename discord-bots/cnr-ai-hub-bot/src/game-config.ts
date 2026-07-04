export const roleKeys = {
  registered: "registered",
  cop: "cop",
  suspect: "suspect",
  mostWanted: "most_wanted",
  jailed: "jailed",
  dead: "dead",
  fbi: "fbi",
  hitman: "hitman",
  robber: "robber",
  cuffed: "cuffed",
  frozen: "frozen",
  target: "target",
  cnrBanned: "cnr_banned",
  cnrMuted: "cnr_muted",
  cnrSuspended: "cnr_suspended",
  moderatorDuty: "moderator_duty",
  supervisorDuty: "supervisor_duty",
  anhemode: "anhemode",
  aprelmode: "aprelmode",
  wallet: "wallet",
  shield: "shield",
  cuffKit: "cuff_kit",
  pin: "pin",
  insurance: "insurance"
} as const;

export const virtualRoleDefinitions = [
  { key: roleKeys.registered, name: "Registered", group: "profile" },
  { key: roleKeys.cop, name: "Cop", group: "game_mode" },
  { key: roleKeys.robber, name: "Robber", group: "game_mode" },
  { key: roleKeys.fbi, name: "FBI", group: "game_mode" },
  { key: roleKeys.hitman, name: "Hitman", group: "game_mode" },
  { key: roleKeys.suspect, name: "Suspect", group: "status" },
  { key: roleKeys.mostWanted, name: "Most Wanted", group: "status" },
  { key: roleKeys.cuffed, name: "Cuffed", group: "status" },
  { key: roleKeys.jailed, name: "Jailed", group: "status" },
  { key: roleKeys.dead, name: "Dead", group: "status" },
  { key: roleKeys.frozen, name: "Frozen", group: "status" },
  { key: roleKeys.target, name: "Target", group: "status" },
  { key: roleKeys.cnrBanned, name: "CNR Banned", group: "moderation" },
  { key: roleKeys.cnrMuted, name: "CNR Muted", group: "moderation" },
  { key: roleKeys.cnrSuspended, name: "CNR Suspended", group: "moderation" },
  { key: roleKeys.moderatorDuty, name: "Moderator Duty", group: "duty" },
  { key: roleKeys.supervisorDuty, name: "Supervisor Duty", group: "duty" },
  { key: roleKeys.anhemode, name: "Anhemode", group: "special" },
  { key: roleKeys.aprelmode, name: "Aprelmode", group: "special" },
  { key: roleKeys.wallet, name: "Wallet", group: "item" },
  { key: roleKeys.shield, name: "Shield", group: "item" },
  { key: roleKeys.cuffKit, name: "Cuff Kit", group: "item" },
  { key: roleKeys.pin, name: "Pin", group: "item" },
  { key: roleKeys.insurance, name: "Insurance", group: "item" }
];

export const interiors = [
  { name: "Ammunation", value: "ammunation", discordRoleName: "📍 In Ammunation", discordRoleId: "1514206251997724824" },
  { name: "Bank", value: "bank", discordRoleName: "📍 In Bank", discordRoleId: "1514206254200000613" },
  { name: "Item Shop", value: "item_shop", discordRoleName: "📍 In Item Shop", discordRoleId: "1514206262936731729" },
  { name: "Casino", value: "casino", discordRoleName: "📍 In Casino", discordRoleId: "1514206272159879278" },
  { name: "Restaurant", value: "restaurant", discordRoleName: "📍 In Restaurant", discordRoleId: "1514206273967489206" },
  { name: "Hospital", value: "hospital", discordRoleName: "📍 In Hospital", discordRoleId: "1514206294263992420" }
];

export const shopItems = {
  pin: { name: "Pin", price: 3000, roleKey: roleKeys.pin, description: "Break another player's cuffs." },
  cuff_kit: { name: "Cuff Kit", price: 6000, roleKey: roleKeys.cuffKit, discordRoleId: "1514206124608585800", description: "Break your own cuffs." },
  wallet: { name: "Wallet", price: 8000, roleKey: roleKeys.wallet, discordRoleId: "1514206109508829264", description: "Protects you from player robberies." },
  insurance: { name: "Insurance", price: 50000, roleKey: roleKeys.insurance, description: "Keeps inventory safer after death or quit." }
};

export const weapons = {
  1: { name: "Glock 17", damage: 12, price: 3500, roleKey: "weapon_glock_17", discordRoleId: "1514206129092169869" },
  2: { name: "Desert Eagle", damage: 22, price: 6000, roleKey: "weapon_desert_eagle", discordRoleId: "1514206137996677170" },
  3: { name: "Remington 870", damage: 35, price: 8000, roleKey: "weapon_remington_870", discordRoleId: "1514206142132129813" },
  4: { name: "Mossberg 500", damage: 40, price: 12000, roleKey: "weapon_mossberg_500", discordRoleId: "1514206146758578337" },
  5: { name: "MP5", damage: 18, price: 10000, roleKey: "weapon_mp5", discordRoleId: "1514206151372439572" },
  6: { name: "Uzi", damage: 20, price: 14000, roleKey: "weapon_uzi", discordRoleId: "1514206148457140334" },
  7: { name: "M16", damage: 28, price: 16000, roleKey: "weapon_m16", discordRoleId: "1514206177108693093" },
  8: { name: "AK-47", damage: 32, price: 20000, roleKey: "weapon_ak_47", discordRoleId: "1514206175242227753" },
  9: { name: "Remington 700", damage: 50, price: 28000, roleKey: "weapon_remington_700", discordRoleId: "1514206188596756501" },
  10: { name: "Barrett M82", damage: 75, price: 50000, roleKey: "weapon_barrett_m82", discordRoleId: "1514206181328027828" }
};

export const gameModes = {
  cop: roleKeys.cop,
  robber: roleKeys.robber,
  fbi: roleKeys.fbi,
  hitman: roleKeys.hitman
};
