# Spotify Telegram Bot

A Telegram bot that downloads Spotify tracks when users share links in a group.

## Setup

1. **Install dependencies:**

   ```
   npm install
   ```

2. **Create a .env file:**

   Create a file named `.env` in the root directory with the following content:

   ```
   # Telegram Bot Token
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token

   # RapidAPI Credentials
   RAPIDAPI_KEY=your_rapidapi_key
   RAPIDAPI_HOST=spotify-downloader9.p.rapidapi.com

   # Zyla API Key (optional)
   ZYLA_API_KEY=your_zyla_api_key
   ```

3. **Get a Telegram Bot Token:**

   - Message [@BotFather](https://t.me/BotFather) on Telegram
   - Use the `/newbot` command to create a new bot
   - Copy the token provided by BotFather
   - Add it to your `.env` file

4. **RapidAPI Key:**

   - If you don't have a RapidAPI key, sign up at [RapidAPI](https://rapidapi.com/)
   - Subscribe to the [Spotify Downloader API](https://rapidapi.com/search/spotify%20downloader)
   - Copy your API key from the RapidAPI dashboard
   - Add it to your `.env` file

5. **Zyla API Key (Optional backup):**

   - Visit [Zyla API Hub](https://zylalabs.com/api-marketplace/tools/spotify+song+downloader+api/1599)
   - Sign up for a free trial (50 requests)
   - Add your key to the `.env` file

6. **Start the bot:**
   ```
   npm start
   ```

## Troubleshooting

If you're getting connection errors:

1. Make sure your network connection is stable
2. The bot tries two different API services for better reliability
3. Check that you have sufficient rights in the Telegram group
4. The bot now downloads tracks locally before sending, which helps avoid Telegram timeouts

## Usage

1. Add the bot to your Telegram group
2. Send a Spotify track link in the group
3. The bot will download the track and send it back to the group

## API Information

This bot uses multiple API providers for redundancy:

- RapidAPI Spotify Downloader (primary)
- Zyla Labs Spotify Downloader API (backup)

## Note

Please use this bot responsibly and respect copyright laws in your jurisdiction.
