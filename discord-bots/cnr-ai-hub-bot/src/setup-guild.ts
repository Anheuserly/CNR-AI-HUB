import { Client, Events, GatewayIntentBits } from "discord.js";
import { env } from "./env.js";
import { authChannelId, sendAuthPanel } from "./auth-panel.js";

const guildId = process.argv[2] || env.guildId;

if (!env.token || !guildId) {
  throw new Error("Missing CNR_AI_HUB_BOT_TOKEN or guild id. Pass guild id as an argument or set DISCORD_GUILD_ID.");
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.roles.fetch();
    await guild.channels.fetch();

    console.log(`Connected as ${client.user?.tag}`);
    console.log(`Refreshing CNR login panel for guild: ${guild.name} (${guild.id})`);

    await sendAuthPanel(guild, authChannelId);

    console.log("CNR login panel refresh complete.");
  } finally {
    client.destroy();
  }
});

await client.login(env.token);
