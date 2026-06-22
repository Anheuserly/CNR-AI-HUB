import { AttachmentBuilder, EmbedBuilder, Message } from "discord.js";
import { env } from "./env.js";
import { logBotEvent } from "./appwrite.js";

export const aiChatChannelId = "1514206353747611760";

const chatEndpoint = "https://router.huggingface.co/v1/chat/completions";
const imageEndpointBase = "https://router.huggingface.co/hf-inference/models";
const maxDiscordMessageLength = 1900;
const fallbackChatModels = ["Qwen/Qwen2.5-7B-Instruct:together", "mistralai/Mistral-7B-Instruct-v0.3:together"];

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: string;
};

export async function handleHuggingFaceAiMessage(message: Message) {
  if (message.author.bot || message.channelId !== aiChatChannelId) return false;
  if (!message.inGuild()) return false;

  const prompt = cleanPrompt(message.content);
  if (!prompt) return true;

  if (!env.huggingFaceToken) {
    await message.reply("Hugging Face is not connected yet. Add `HF_TOKEN=` in `.env.local`, restart the bot, then try again.");
    return true;
  }

  await message.channel.sendTyping().catch(() => null);

  try {
    const imagePrompt = parseImagePrompt(prompt);
    if (imagePrompt) {
      await replyWithImage(message, imagePrompt);
      return true;
    }

    await replyWithChat(message, prompt);
    return true;
  } catch (error) {
    console.error("Hugging Face AI message failed:", error);
    await logBotEvent("huggingface_ai_error", {
      severity: "error",
      discordUserId: message.author.id,
      serverId: message.guildId,
      channelId: message.channelId,
      error: error instanceof Error ? error.message : "unknown error"
    });
    await message.reply("The AI request failed. Check the Hugging Face token/model or try again in a moment.");
    return true;
  }
}

async function replyWithChat(message: Message, prompt: string) {
  const errors: string[] = [];

  for (const model of chatModels()) {
    const response = await fetch(chatEndpoint, {
      method: "POST",
      headers: huggingFaceJsonHeaders(),
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are CNR AI Hub, a helpful Discord assistant for a Cops and Robbers gaming community. Be clear, friendly, concise, and useful. Do not pretend to be a moderator. If asked for server punishments or private data, tell the user to contact staff."
          },
          {
            role: "user",
            content: `${message.member?.displayName || message.author.username}: ${prompt}`
          }
        ],
        max_tokens: 450,
        temperature: 0.7
      })
    });

    const data = (await parseJsonResponse(response).catch((error) => {
      errors.push(`${model}: ${error instanceof Error ? error.message : "unknown error"}`);
      return null;
    })) as ChatCompletionResponse | null;

    const content = data?.choices?.[0]?.message?.content?.trim();
    if (content) {
      await message.reply(trimDiscordMessage(content));
      return;
    }

    if (data) errors.push(`${model}: Hugging Face returned an empty chat response.`);
  }

  throw new Error(errors.join(" | ") || "No Hugging Face chat model responded.");
}

async function replyWithImage(message: Message, prompt: string) {
  const response = await fetch(`${imageEndpointBase}/${encodeURIComponentModel(env.huggingFaceImageModel)}`, {
    method: "POST",
    headers: huggingFaceImageHeaders(),
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        guidance_scale: 4,
        num_inference_steps: 28
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Image generation failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  if (!contentType.startsWith("image/")) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Image generation returned non-image content: ${detail.slice(0, 300)}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = contentType.includes("jpeg") ? "jpg" : "png";
  const attachment = new AttachmentBuilder(buffer, { name: `cnr-ai-image.${extension}` });
  const embed = new EmbedBuilder()
    .setTitle("CNR AI Image")
    .setDescription(`Prompt: ${trimDiscordMessage(prompt, 900)}`)
    .setColor(0x40dfa7)
    .setImage(`attachment://cnr-ai-image.${extension}`)
    .setFooter({ text: `Generated with Hugging Face: ${env.huggingFaceImageModel}` })
    .setTimestamp();

  await message.reply({ embeds: [embed], files: [attachment] });
}

function parseImagePrompt(prompt: string) {
  const match = prompt.match(/^(?:\/?image|\/?imagine|generate image|make image|create image)\s*[:\-]?\s+(.+)/i);
  return match?.[1]?.trim();
}

function cleanPrompt(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 2000);
}

function huggingFaceJsonHeaders() {
  return {
    Authorization: `Bearer ${env.huggingFaceToken}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}

function huggingFaceImageHeaders() {
  return {
    Authorization: `Bearer ${env.huggingFaceToken}`,
    "Content-Type": "application/json",
    Accept: "image/png"
  };
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Hugging Face returned non-JSON response (${response.status}): ${text.slice(0, 300)}`);
  }

  if (!response.ok) {
    const message = typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : text;
    throw new Error(`Hugging Face request failed (${response.status}): ${message.slice(0, 300)}`);
  }

  return data;
}

function trimDiscordMessage(value: string, maxLength = maxDiscordMessageLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 20).trim()}...` : value;
}

function encodeURIComponentModel(model: string) {
  return model
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function chatModels() {
  return [...new Set([env.huggingFaceChatModel, ...fallbackChatModels].filter(Boolean))];
}
