const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// send message function
async function sendMessage(chatId, text) {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: text
    });
}
function searchParcel(chatId, tracking) {
    const sheetData = [1GYfhmascc_5uXf6Wm8jvkvoadH7ALCopKZOfUul7iaY
        ["ZUVO1001", "Ahmed", "Delivered"],
        ["ZUVO1002", "Ali", "In Transit"]
    ];

    const result = sheetData.find(p => p[0] === tracking);

    if (!result) {
        return sendMessage(chatId, "❌ Not found");
    }

    sendMessage(chatId,
        `📦 Found Parcel\n\n` +
        `Tracking: ${result[0]}\n` +
        `Name: ${result[1]}\n` +
        `Status: ${result[2]}`
    );
}
// webhook route (Telegram sends messages here)
app.post("/webhook", async (req, res) => {
    const update = req.body;

    console.log("Update received:", JSON.stringify(update));

    if (!update.message || !update.message.text) {
        return res.sendStatus(200);
    }

    const chatId = update.message.chat.id;
    const text = update.message.text;

    if (text === "/start") {
        await sendMessage(chatId, "🚚 Welcome to ZUVO Parcel Bot!");
    }
    else if (text === "/help") {
        await sendMessage(chatId, "Commands: /track /phone /help");
    }
    else {
        await sendMessage(chatId, "You said: " + text);
    }
else if (text.startsWith("/track")) {
    sendMessage(chatId, "🔍 Send your tracking number");
}
else if (userState === "tracking") {
    searchParcel(chatId, text);
}
    res.sendStatus(200);
});

// health check (to test server)
app.get("/", (req, res) => {
    res.send("ZUVO Bot is running ✅");
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Bot running on port " + PORT);
});
