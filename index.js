const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// ===================== SEND MESSAGE =====================
async function sendMessage(chatId, text) {
    try {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: "HTML"
        });
    } catch (err) {
        console.log("Send error:", err.message);
    }
}

// ===================== MAIN WEBHOOK =====================
app.post("/webhook", async (req, res) => {
    try {
        const update = req.body;

        console.log("🔥 WEBHOOK HIT");
        console.log(JSON.stringify(update));

        if (!update.message || !update.message.text) {
            return res.sendStatus(200);
        }

        const chatId = update.message.chat.id;
        const text = update.message.text.trim();

        // ===================== COMMANDS =====================

        if (text === "/start") {
            await sendMessage(
                chatId,
                "🚚 <b>Welcome to ZUVO Parcel Bot</b>\n\nSend /track to track your parcel."
            );
        }

        else if (text === "/help") {
            await sendMessage(
                chatId,
                "📦 Commands:\n/start\n/help\n/track"
            );
        }

        else if (text === "/track") {
            await sendMessage(
                chatId,
                "🔍 Please send your tracking number"
            );
        }

        // ===================== SIMPLE TRACK TEST =====================
        else if (text.startsWith("ZUVO")) {
            await sendMessage(
                chatId,
                `📦 Parcel Found!\n\nTracking: ${text}\nStatus: In System (Demo)`
            );
        }

        else {
            await sendMessage(
                chatId,
                `You said: ${text}`
            );
        }

        res.sendStatus(200);
    } catch (error) {
        console.log("Webhook error:", error.message);
        res.sendStatus(200);
    }
});

// ===================== HEALTH CHECK =====================
app.get("/", (req, res) => {
    res.send("🚚 ZUVO Bot is running ✅");
});

// ===================== START SERVER =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Bot running on port " + PORT);
});
