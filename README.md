# CNR AI Hub

CNR AI Hub is a Next.js website with Appwrite auth/database support and two Discord bots:

- `discord-bots/cnr-ai-hub-bot` - main hub bot for announcements, onboarding, and member memory.
- `discord-bots/cnr-ai-chat-bot` - AI chat bot focused on conversational help.
- `docs/cnr-ai-discord-agents.yaml` - smart prompt blueprint for both Discord bots.

## First Setup

```bash
npm install
cp .env.example .env.local
```

Fill the Appwrite values in `.env.local`, then create the database schema:

```bash
npm run appwrite:setup
```

Run the website:

```bash
npm run dev
```

Run a bot:

```bash
npm run dev:hub-bot
npm run dev:chat-bot
```

## Discord Bot Tokens

Add tokens later in `.env.local`:

```env
CNR_AI_HUB_BOT_TOKEN=
CNR_AI_CHAT_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
```

Register slash commands after tokens/client IDs are ready:

```bash
npm run register:hub-bot
npm run register:chat-bot
```

## Hugging Face AI Channel

The hub bot can answer only inside the Discord `chat-with-ai` channel:

- Channel ID: `1514206353747611760`
- Normal messages become AI chat replies.
- Image requests work with `image: your prompt`, `imagine: your prompt`, or `generate image: your prompt`.

Add these values to `.env.local`, then restart the hub bot:

```env
HF_TOKEN=
HF_CHAT_MODEL=HuggingFaceBio/Carbon-3B:hf-inference
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell
```

## Appwrite Collections

The setup script creates:

- `user_data`
- `discord_servers`
- `bot_conversations`
- `bot_events`
- `hub_resources`

The Discord bots use `discord_user_id` as the stable user identity key.
