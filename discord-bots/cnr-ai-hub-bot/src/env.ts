import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), override: false });
config({ path: resolve(process.cwd(), "../../.env.local"), override: false });

export const env = {
  token: process.env.CNR_AI_HUB_BOT_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  appwriteEndpoint: process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  appwriteProjectId: process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  appwriteApiKey: process.env.APPWRITE_API_KEY,
  appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "cnr_ai_hub",
  huggingFaceToken: process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN,
  huggingFaceChatModel: process.env.HF_CHAT_MODEL || "Qwen/Qwen2.5-7B-Instruct:together",
  huggingFaceImageModel: process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell"
};
