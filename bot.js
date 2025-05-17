const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const http = require("http");
require("dotenv").config(); // Load environment variables from .env file

// Create a new bot instance
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Regular expression to match Spotify track links
const spotifyRegex = /https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;

// Create temporary directory for downloads if it doesn't exist
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is running\n");
  })
  .listen(PORT, () => {
    console.log(`Dummy server listening on port ${PORT}`);
  });

// Listen for messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  // Check if the message contains a Spotify link
  const match = text.match(spotifyRegex);

  if (match) {
    const spotifyLink = match[0];
    const trackId = match[1];

    try {
      // Send a status message
      const statusMessage = await bot.sendMessage(
        chatId,
        `Processing Spotify link: ${spotifyLink}`
      );

      // Try multiple API endpoints
      let trackData = null;
      let error = null;

      // First try with RapidAPI
      try {
        trackData = await downloadWithRapidAPI(spotifyLink);
      } catch (err) {
        console.log("RapidAPI error:", err.message);
        error = err;

        // Try with Zyla API as fallback
        try {
          trackData = await downloadWithZylaAPI(trackId);
        } catch (err2) {
          console.log("Zyla API error:", err2.message);
          error = err2;
        }
      }

      console.log("trackData", trackData);

      // Check for RapidAPI success format
      if (
        trackData &&
        trackData.success &&
        trackData.data &&
        trackData.data.downloadLink
      ) {
        // Update status message
        await bot.editMessageText(
          `Downloading track '${trackData.data.title}' by ${trackData.data.artist}...`,
          {
            chat_id: chatId,
            message_id: statusMessage.message_id,
          }
        );

        try {
          // Download the file locally first
          const localPath = path.join(tempDir, `${trackId}.mp3`);

          // Download file using axios
          const response = await axios({
            method: "GET",
            url: trackData.data.downloadLink,
            responseType: "stream",
          });

          const writer = fs.createWriteStream(localPath);
          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          // Send the audio file from local path
          await bot.sendAudio(chatId, localPath, {
            title: trackData.data.title,
            performer: trackData.data.artist,
            caption: `🎵 ${trackData.data.title} - ${trackData.data.artist}`,
            thumb: trackData.data.cover,
          });

          // Delete the local file
          fs.unlinkSync(localPath);

          // Delete the status message
          await bot.deleteMessage(chatId, statusMessage.message_id);
        } catch (downloadErr) {
          console.error("Download error:", downloadErr.message);
          // If downloading fails, just send the link
          await bot.editMessageText(
            `Download failed, here's the direct link: ${trackData.data.downloadLink}`,
            {
              chat_id: chatId,
              message_id: statusMessage.message_id,
            }
          );
        }
      }
      // Check for previous format or Zyla API format
      else if (trackData && (trackData.downloadLink || trackData.previewUrl)) {
        const downloadUrl = trackData.downloadLink || trackData.previewUrl;

        // Update status message
        await bot.editMessageText(`Downloading track...`, {
          chat_id: chatId,
          message_id: statusMessage.message_id,
        });

        try {
          // Download the file locally first
          const localPath = path.join(tempDir, `${trackId}.mp3`);

          // Download file using axios
          const response = await axios({
            method: "GET",
            url: downloadUrl,
            responseType: "stream",
          });

          const writer = fs.createWriteStream(localPath);
          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          // Send the audio file from local path
          await bot.sendAudio(chatId, localPath, {
            title: trackData.title || "Spotify Track",
            performer: trackData.artists || "Unknown Artist",
            caption: `🎵 ${trackData.title || "Spotify Track"} - ${
              trackData.artists || "Unknown Artist"
            }`,
          });

          // Delete the local file
          fs.unlinkSync(localPath);

          // Delete the status message
          await bot.deleteMessage(chatId, statusMessage.message_id);
        } catch (downloadErr) {
          console.error("Download error:", downloadErr.message);
          // If downloading fails, just send the link
          await bot.editMessageText(
            `Download failed, here's the direct link: ${downloadUrl}`,
            {
              chat_id: chatId,
              message_id: statusMessage.message_id,
            }
          );
        }
      } else {
        await bot.editMessageText(
          `Sorry, I could not download this track. Error: ${
            error?.message || "Unknown error"
          }`,
          {
            chat_id: chatId,
            message_id: statusMessage.message_id,
          }
        );
      }
    } catch (error) {
      console.error("Error:", error.message);
      bot.sendMessage(
        chatId,
        "Sorry, an error occurred while processing the Spotify link."
      );
    }
  }
});

// Function to download a Spotify track using the RapidAPI endpoint
async function downloadWithRapidAPI(spotifyUrl) {
  const options = {
    method: "GET",
    url: "https://spotify-downloader9.p.rapidapi.com/downloadSong",
    params: {
      songId: spotifyUrl,
    },
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": process.env.RAPIDAPI_HOST,
    },
    timeout: 3000000, // 3000 seconds timeout
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.log(error);

    console.error("RapidAPI download error:", error.message);
    throw error;
  }
}

// Function to download using Zyla API
async function downloadWithZylaAPI(trackId) {
  const options = {
    method: "GET",
    url: "https://zylalabs.com/api/1599/spotify+song+downloader+api/1283/download",
    params: {
      ids: trackId,
    },
    headers: {
      Authorization: `Bearer ${process.env.ZYLA_API_KEY}`,
    },
    timeout: 30000, // 30 seconds timeout
  };

  try {
    const response = await axios.request(options);

    // Adapt the response format to match what the bot expects
    if (
      response.data &&
      response.data.tracks &&
      response.data.tracks.length > 0
    ) {
      const track = response.data.tracks[0];
      return {
        title: track.name,
        artists: track.artists.map((a) => a.name).join(", "),
        previewUrl: track.preview_url,
        // If you have the premium Zyla API, you might get a downloadLink property
        downloadLink: track.preview_url, // Using preview URL as fallback
      };
    }
    throw new Error("No track data found in the response");
  } catch (error) {
    console.error("ZylaAPI download error:", error.message);
    throw error;
  }
}

console.log("Bot started! Press Ctrl+C to stop.");
