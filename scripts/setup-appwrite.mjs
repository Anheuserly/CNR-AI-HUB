import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";
import { config } from "dotenv";
import process from "node:process";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "cnr_ai_hub";

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY.");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

const permissions = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.team("admins"))
];

const collections = [
  {
    id: "user_data",
    name: "User Data",
    indexes: [
      ["discord_user_id_idx", "key", ["discord_user_id"]],
      ["server_id_idx", "key", ["server_id"]],
      ["last_seen_at_idx", "key", ["last_seen_at"]]
    ],
    attributes: [
      ["string", "discord_user_id", 64, true],
      ["string", "discord_username", 128, true],
      ["string", "global_name", 128, false],
      ["string", "avatar_url", 512, false],
      ["string", "server_id", 64, false],
      ["string", "server_name", 160, false],
      ["string", "roles", 128, false, true],
      ["string", "preferred_name", 128, false],
      ["string", "memory_summary", 4000, false],
      ["string", "interests", 128, false, true],
      ["integer", "warnings_count", false],
      ["datetime", "last_seen_at", false],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true]
    ]
  },
  {
    id: "discord_servers",
    name: "Discord Servers",
    indexes: [["server_id_idx", "key", ["server_id"]]],
    attributes: [
      ["string", "server_id", 64, true],
      ["string", "server_name", 160, true],
      ["string", "owner_id", 64, false],
      ["integer", "member_count", false],
      ["boolean", "hub_bot_enabled", false],
      ["boolean", "chat_bot_enabled", false],
      ["string", "config_json", 8000, false],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true]
    ]
  },
  {
    id: "bot_conversations",
    name: "Bot Conversations",
    indexes: [
      ["discord_user_id_idx", "key", ["discord_user_id"]],
      ["server_id_idx", "key", ["server_id"]],
      ["channel_id_idx", "key", ["channel_id"]],
      ["bot_name_idx", "key", ["bot_name"]],
      ["created_at_idx", "key", ["created_at"]]
    ],
    attributes: [
      ["string", "discord_user_id", 64, true],
      ["string", "server_id", 64, false],
      ["string", "channel_id", 64, false],
      ["string", "bot_name", 64, true],
      ["string", "message", 4000, true],
      ["string", "response", 4000, false],
      ["string", "prompt_version", 32, false],
      ["string", "metadata_json", 2000, false],
      ["datetime", "created_at", true]
    ]
  },
  {
    id: "bot_events",
    name: "Bot Events",
    indexes: [
      ["event_type_idx", "key", ["event_type"]],
      ["bot_name_idx", "key", ["bot_name"]],
      ["discord_user_id_idx", "key", ["discord_user_id"]],
      ["server_id_idx", "key", ["server_id"]],
      ["created_at_idx", "key", ["created_at"]]
    ],
    attributes: [
      ["string", "event_type", 80, true],
      ["string", "bot_name", 64, true],
      ["string", "discord_user_id", 64, false],
      ["string", "server_id", 64, false],
      ["string", "channel_id", 64, false],
      ["string", "severity", 24, false],
      ["string", "details_json", 8000, false],
      ["datetime", "created_at", true]
    ]
  },
  {
    id: "hub_resources",
    name: "Hub Resources",
    indexes: [
      ["slug_idx", "key", ["slug"]],
      ["category_idx", "key", ["category"]],
      ["visibility_idx", "key", ["visibility"]]
    ],
    attributes: [
      ["string", "title", 180, true],
      ["string", "slug", 160, true],
      ["string", "category", 120, false],
      ["string", "content", 12000, true],
      ["string", "visibility", 40, false],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true]
    ]
  },
  {
    id: "game_profiles",
    name: "Game Profiles",
    indexes: [
      ["discord_user_id_idx", "key", ["discord_user_id"]],
      ["server_id_idx", "key", ["server_id"]],
      ["active_mode_idx", "key", ["active_mode"]]
    ],
    attributes: [
      ["string", "discord_user_id", 64, true],
      ["string", "server_id", 64, false],
      ["string", "active_mode", 32, false],
      ["string", "current_interior", 80, false],
      ["integer", "currency", false],
      ["integer", "marked_money", false],
      ["integer", "level", false],
      ["integer", "experience", false],
      ["integer", "health", false],
      ["integer", "max_health", false],
      ["integer", "armor", false],
      ["integer", "score", false],
      ["integer", "robbed_money", false],
      ["integer", "returned_money", false],
      ["integer", "total_earned", false],
      ["integer", "total_spent", false],
      ["boolean", "is_dead", false],
      ["string", "inventory_json", 4000, false],
      ["string", "stats_json", 3000, false],
      ["datetime", "last_daily_claim_at", false],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true]
    ]
  },
  {
    id: "game_transactions",
    name: "Game Transactions",
    indexes: [
      ["discord_user_id_idx", "key", ["discord_user_id"]],
      ["server_id_idx", "key", ["server_id"]],
      ["transaction_type_idx", "key", ["transaction_type"]],
      ["created_at_idx", "key", ["created_at"]]
    ],
    attributes: [
      ["string", "discord_user_id", 64, true],
      ["string", "server_id", 64, false],
      ["string", "transaction_type", 80, true],
      ["integer", "amount", false],
      ["integer", "balance_after", false],
      ["string", "target_user_id", 64, false],
      ["string", "details_json", 2500, false],
      ["datetime", "created_at", true]
    ]
  },
  {
    id: "game_actions",
    name: "Game Actions",
    indexes: [
      ["actor_user_id_idx", "key", ["actor_user_id"]],
      ["server_id_idx", "key", ["server_id"]],
      ["action_type_idx", "key", ["action_type"]],
      ["created_at_idx", "key", ["created_at"]]
    ],
    attributes: [
      ["string", "actor_user_id", 64, true],
      ["string", "target_user_id", 64, false],
      ["string", "server_id", 64, false],
      ["string", "channel_id", 64, false],
      ["string", "action_type", 80, true],
      ["string", "result", 80, false],
      ["string", "details_json", 3000, false],
      ["datetime", "created_at", true]
    ]
  },
  {
    id: "tickets",
    name: "Tickets",
    indexes: [
      ["ticket_id_idx", "key", ["ticket_id"]],
      ["server_id_idx", "key", ["server_id"]],
      ["creator_user_id_idx", "key", ["creator_user_id"]],
      ["status_idx", "key", ["status"]],
      ["created_at_idx", "key", ["created_at"]]
    ],
    attributes: [
      ["string", "ticket_id", 80, true],
      ["string", "server_id", 64, false],
      ["string", "channel_id", 64, false],
      ["string", "creator_user_id", 64, true],
      ["string", "assigned_user_id", 64, false],
      ["string", "category", 80, false],
      ["string", "status", 40, true],
      ["string", "details_json", 3000, false],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true],
      ["datetime", "closed_at", false]
    ]
  },
  {
    id: "giveaways",
    name: "Giveaways",
    indexes: [
      ["message_id_idx", "key", ["message_id"]],
      ["server_id_idx", "key", ["server_id"]],
      ["status_idx", "key", ["status"]],
      ["ends_at_idx", "key", ["ends_at"]]
    ],
    attributes: [
      ["string", "message_id", 64, true],
      ["string", "server_id", 64, false],
      ["string", "channel_id", 64, false],
      ["string", "host_user_id", 64, true],
      ["string", "prize", 200, true],
      ["integer", "winner_count", false],
      ["string", "status", 40, true],
      ["datetime", "ends_at", true],
      ["string", "winner_ids_json", 2000, false],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true]
    ]
  },
  {
    id: "moderation_cases",
    name: "Moderation Cases",
    indexes: [
      ["case_type_idx", "key", ["case_type"]],
      ["server_id_idx", "key", ["server_id"]],
      ["target_user_id_idx", "key", ["target_user_id"]],
      ["created_at_idx", "key", ["created_at"]]
    ],
    attributes: [
      ["string", "case_type", 80, true],
      ["string", "server_id", 64, false],
      ["string", "moderator_user_id", 64, true],
      ["string", "target_user_id", 64, true],
      ["string", "reason", 1000, false],
      ["string", "status", 40, true],
      ["datetime", "expires_at", false],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true]
    ]
  },
  {
    id: "cooldown_records",
    name: "Cooldown Records",
    indexes: [
      ["cooldown_key_idx", "key", ["cooldown_key"]],
      ["discord_user_id_idx", "key", ["discord_user_id"]],
      ["expires_at_idx", "key", ["expires_at"]]
    ],
    attributes: [
      ["string", "cooldown_key", 120, true],
      ["string", "discord_user_id", 64, true],
      ["string", "server_id", 64, false],
      ["datetime", "expires_at", true],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true]
    ]
  },
  {
    id: "role_definitions",
    name: "Role Definitions",
    indexes: [
      ["role_key_idx", "key", ["role_key"]],
      ["role_group_idx", "key", ["role_group"]],
      ["legacy_discord_role_id_idx", "key", ["legacy_discord_role_id"]]
    ],
    attributes: [
      ["string", "role_key", 120, true],
      ["string", "display_name", 160, true],
      ["string", "role_group", 80, true],
      ["string", "legacy_discord_role_id", 64, false],
      ["string", "description", 500, false],
      ["boolean", "assignable", false],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true]
    ]
  },
  {
    id: "virtual_roles",
    name: "Virtual Roles",
    indexes: [
      ["discord_user_id_idx", "key", ["discord_user_id"]],
      ["server_id_idx", "key", ["server_id"]],
      ["role_key_idx", "key", ["role_key"]],
      ["active_idx", "key", ["active"]]
    ],
    attributes: [
      ["string", "discord_user_id", 64, true],
      ["string", "server_id", 64, false],
      ["string", "role_key", 120, true],
      ["boolean", "active", false],
      ["string", "source", 80, false],
      ["datetime", "expires_at", false],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true]
    ]
  },
  {
    id: "interior_definitions",
    name: "Interior Definitions",
    indexes: [
      ["interior_key_idx", "key", ["interior_key"]],
      ["legacy_discord_role_id_idx", "key", ["legacy_discord_role_id"]],
      ["active_idx", "key", ["active"]]
    ],
    attributes: [
      ["string", "interior_key", 120, true],
      ["string", "display_name", 160, true],
      ["string", "legacy_discord_role_id", 64, false],
      ["boolean", "active", false],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true]
    ]
  },
  {
    id: "catalog_items",
    name: "Catalog Items",
    indexes: [
      ["item_key_idx", "key", ["item_key"]],
      ["item_type_idx", "key", ["item_type"]],
      ["role_key_idx", "key", ["role_key"]],
      ["legacy_discord_role_id_idx", "key", ["legacy_discord_role_id"]],
      ["active_idx", "key", ["active"]]
    ],
    attributes: [
      ["string", "item_key", 120, true],
      ["string", "display_name", 160, true],
      ["string", "item_type", 80, true],
      ["integer", "price", false],
      ["integer", "damage", false],
      ["string", "role_key", 120, false],
      ["string", "legacy_discord_role_id", 64, false],
      ["boolean", "active", false],
      ["datetime", "created_at", true],
      ["datetime", "updated_at", true]
    ]
  }
];

const roleDefinitions = [
  ["registered", "Registered", "profile", "1261768026559086592"],
  ["cop", "Cop", "game_mode", "1247162188913971272"],
  ["robber", "Robber", "game_mode", "1248188281976389689"],
  ["fbi", "FBI", "game_mode", "1248949429713764353"],
  ["hitman", "Hitman", "game_mode", "1248697926515953694"],
  ["suspect", "Suspect", "status", "1247162056793391175"],
  ["cuffed", "Cuffed", "status", "1263908645763158157"],
  ["jailed", "Jailed", "status", "1247170843616874518"],
  ["dead", "Dead", "status", "1247164748278140978"],
  ["frozen", "Frozen", "status", "1272151730368417903"],
  ["target", "Target", "status", "1265726365597044837"],
  ["cnr_banned", "CNR Banned", "moderation", "1287022670428504165"],
  ["cnr_muted", "CNR Muted", "moderation", "1288926880195543082"],
  ["cnr_suspended", "CNR Suspended", "moderation", "1287022807678582787"],
  ["moderator_duty", "Moderator Duty", "duty", "1248950550131085352"],
  ["supervisor_duty", "Supervisor Duty", "duty", "1248950646593114153"],
  ["anhemode", "Anhemode", "special", "1287387552831242250"],
  ["aprelmode", "Aprelmode", "special", "1287387695185920132"],
  ["wallet", "Wallet", "item", "1262461198843248680"],
  ["shield", "Shield", "item", "1262461647491043471"],
  ["cuff_kit", "Cuff Kit", "item", "1262461877997535292"],
  ["pin", "Pin", "item", "1262461477948882975"]
];

const interiorDefinitions = [
  ["ammunation", "Ammunation", "1247197731475161198"],
  ["bank", "Bank", "1247197700051701842"],
  ["black_market", "Black Market", "1248188152997478450"],
  ["item_shop", "Item Shop", "1247197782146678804"],
  ["casino", "Casino", "1291385955193978952"],
  ["restaurant", "Restaurant", "1291385987091402834"],
  ["nightclub", "Nightclub", "1291386019985143040"],
  ["cluckin_bell", "Cluckin Bell", "129138604287562624"],
  ["maze_bank", "Maze Bank", "1291386065766201600"],
  ["vagos", "Vagos", "1291386098658972160"],
  ["hospital", "Hospital", "1291385992234567891"],
  ["library", "Library", "1291385993234567892"],
  ["hotel", "Hotel", "1291385994234567893"],
  ["park", "Park", "1291385995234567894"],
  ["gym", "Gym", "1291385996234567895"],
  ["beach", "Beach", "1291385997234567896"],
  ["supermarket", "Supermarket", "1291385998234567897"],
  ["post_office", "Post Office", "1291385999234567898"],
  ["bar", "Bar", "1291386000234567899"]
];

const catalogItems = [
  ["wallet", "Wallet", "shop_item", 100, 0, "wallet", "1262461198843248680"],
  ["shield", "Shield", "shop_item", 200, 0, "shield", "1262461647491043471"],
  ["cuff_kit", "Cuff Kit", "shop_item", 15000, 0, "cuff_kit", "1262461877997535292"],
  ["pin", "Pin", "shop_item", 5000, 0, "pin", "1262461477948882975"],
  ["weapon_glock_17", "Glock 17", "weapon", 3500, 12, "weapon_glock_17", "1249709988503617586"],
  ["weapon_desert_eagle", "Desert Eagle", "weapon", 6000, 22, "weapon_desert_eagle", "1249710117633527838"],
  ["weapon_remington_870", "Remington 870", "weapon", 8000, 35, "weapon_remington_870", "1249710331513671690"],
  ["weapon_mossberg_500", "Mossberg 500", "weapon", 12000, 40, "weapon_mossberg_500", "1249710332109262868"],
  ["weapon_mp5", "MP5", "weapon", 10000, 18, "weapon_mp5", "1249710333120086168"],
  ["weapon_uzi", "Uzi", "weapon", 14000, 20, "weapon_uzi", "1249710333120086168"],
  ["weapon_m16", "M16", "weapon", 16000, 28, "weapon_m16", "1249710334743281795"],
  ["weapon_ak_47", "AK-47", "weapon", 20000, 32, "weapon_ak_47", "1249710334072328264"],
  ["weapon_remington_700", "Remington 700", "weapon", 28000, 50, "weapon_remington_700", "1249710336878317639"],
  ["weapon_barrett_m82", "Barrett M82", "weapon", 50000, 75, "weapon_barrett_m82", "1249710336710283345"]
];

const removedCatalogItemKeys = [
  "weapon_beretta_m9",
  "weapon_scar_h",
  "weapon_knife",
  "weapon_baseball_bat",
  "weapon_crowbar",
  "weapon_grenade",
  "weapon_molotov",
  "weapon_c4"
];

async function ensureDatabase() {
  try {
    await databases.get(databaseId);
    console.log(`Database exists: ${databaseId}`);
  } catch {
    await databases.create(databaseId, "CNR AI Hub");
    console.log(`Created database: ${databaseId}`);
  }
}

async function ensureCollection(collection) {
  let collectionDetails;
  try {
    collectionDetails = await databases.getCollection(databaseId, collection.id);
    console.log(`Collection exists: ${collection.id}`);
  } catch {
    await databases.createCollection(databaseId, collection.id, collection.name, permissions, true);
    console.log(`Created collection: ${collection.id}`);
    collectionDetails = await databases.getCollection(databaseId, collection.id);
  }

  const existingAttributes = new Set(collectionDetails.attributes.map((attribute) => attribute.key));
  for (const attribute of collection.attributes) {
    if (existingAttributes.has(attribute[1])) {
      continue;
    }
    await createAttribute(collection.id, attribute);
  }

  collectionDetails = await databases.getCollection(databaseId, collection.id);
  const existingIndexes = new Set(collectionDetails.indexes.map((index) => index.key));
  for (const [key, type, attrs] of collection.indexes) {
    if (existingIndexes.has(key)) {
      continue;
    }
    try {
      await databases.createIndex(databaseId, collection.id, key, type, attrs);
      console.log(`Created index ${collection.id}.${key}`);
    } catch (error) {
      if (!String(error?.message || "").includes("already exists")) {
        console.warn(`Index skipped ${collection.id}.${key}: ${error.message}`);
      }
    }
  }
}

async function createAttribute(collectionId, attribute) {
  const [type, key, sizeOrRequired, requiredOrArray, maybeArray] = attribute;
  try {
    if (type === "string") {
      await databases.createStringAttribute(databaseId, collectionId, key, sizeOrRequired, requiredOrArray, undefined, maybeArray || false);
    }
    if (type === "integer") {
      await databases.createIntegerAttribute(databaseId, collectionId, key, sizeOrRequired);
    }
    if (type === "boolean") {
      await databases.createBooleanAttribute(databaseId, collectionId, key, sizeOrRequired);
    }
    if (type === "datetime") {
      await databases.createDatetimeAttribute(databaseId, collectionId, key, sizeOrRequired);
    }
    console.log(`Created attribute ${collectionId}.${key}`);
  } catch (error) {
    if (!String(error?.message || "").includes("already exists")) {
      console.warn(`Attribute skipped ${collectionId}.${key}: ${error.message}`);
    }
  }
}

await ensureDatabase();
for (const collection of collections) {
  await ensureCollection(collection);
}
await seedRoleDefinitions();
await seedInteriorDefinitions();
await seedCatalogItems();

console.log("Appwrite schema setup complete.");

async function seedRoleDefinitions() {
  for (const [roleKey, displayName, roleGroup, legacyDiscordRoleId] of roleDefinitions) {
    const now = new Date().toISOString();
    const existing = await databases.listDocuments(databaseId, "role_definitions", [
      Query.equal("role_key", roleKey),
      Query.limit(1)
    ]);
    const data = {
      role_key: roleKey,
      display_name: displayName,
      role_group: roleGroup,
      legacy_discord_role_id: legacyDiscordRoleId,
      description: `${displayName} virtual role managed by CNR AI Hub Bot.`,
      assignable: true,
      updated_at: now
    };
    if (existing.documents[0]) {
      await databases.updateDocument(databaseId, "role_definitions", existing.documents[0].$id, data);
    } else {
      await databases.createDocument(databaseId, "role_definitions", ID.unique(), {
        ...data,
        created_at: now
      });
    }
  }
  console.log(`Seeded ${roleDefinitions.length} virtual role definitions.`);
}

async function seedInteriorDefinitions() {
  for (const [interiorKey, displayName, legacyDiscordRoleId] of interiorDefinitions) {
    const now = new Date().toISOString();
    const data = {
      interior_key: interiorKey,
      display_name: displayName,
      legacy_discord_role_id: legacyDiscordRoleId,
      active: true,
      updated_at: now
    };
    await upsertByUniqueField("interior_definitions", "interior_key", interiorKey, data, now);
  }
  console.log(`Seeded ${interiorDefinitions.length} interior definitions.`);
}

async function seedCatalogItems() {
  for (const [itemKey, displayName, itemType, price, damage, roleKey, legacyDiscordRoleId] of catalogItems) {
    const now = new Date().toISOString();
    const data = {
      item_key: itemKey,
      display_name: displayName,
      item_type: itemType,
      price,
      damage,
      role_key: roleKey,
      legacy_discord_role_id: legacyDiscordRoleId,
      active: true,
      updated_at: now
    };
    await upsertByUniqueField("catalog_items", "item_key", itemKey, data, now);
  }
  await deactivateRemovedCatalogItems();
  console.log(`Seeded ${catalogItems.length} catalog items.`);
}

async function deactivateRemovedCatalogItems() {
  for (const itemKey of removedCatalogItemKeys) {
    const existing = await databases.listDocuments(databaseId, "catalog_items", [Query.equal("item_key", itemKey), Query.limit(1)]);
    if (existing.documents[0]) {
      await databases.updateDocument(databaseId, "catalog_items", existing.documents[0].$id, {
        active: false,
        updated_at: new Date().toISOString()
      });
    }
  }
}

async function upsertByUniqueField(collectionId, field, value, data, now) {
  const existing = await databases.listDocuments(databaseId, collectionId, [Query.equal(field, value), Query.limit(1)]);

  if (existing.documents[0]) {
    await databases.updateDocument(databaseId, collectionId, existing.documents[0].$id, data);
    return;
  }

  await databases.createDocument(databaseId, collectionId, ID.unique(), {
    ...data,
    created_at: now
  });
}
