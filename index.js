require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("./credentials.json");

const app = express();
app.use(express.json());

const TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const SHEET_ID = "1GYfhmascc_5uXf6Wm8jvkvoadH7ALCopKZOfUul7iaY";

// ===================== GOOGLE SHEET =====================
async function getSheet() {
    const doc = new GoogleSpreadsheet(SHEET_ID);

    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();

    return doc.sheetsByIndex[0];
}

// ===================== SEND MESSAGE =====================
async function sendMessage(chatId, text) {
    try {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text,
            parse_mode: "HTML"
        });
    } catch (err) {
        console.log("Send error:", err.message);
    }
}

// ===================== WEBHOOK =====================
app.post("/webhook", async (req, res) => {
    try {
        const update = req.body;

        if (!update.message || !update.message.text) {
            return res.sendStatus(200);
        }

        const chatId = update.message.chat.id;
        const text = update.message.text.trim().toUpperCase();

        // ---------------- COMMANDS ----------------
        if (text === "/START") {
            return sendMessage(chatId, "🚚 Welcome to ZUVO Bot\n\nSend /TRACK + tracking number");
        }

        if (text === "/HELP") {
            return sendMessage(chatId, "/start /help /track");
        }

        if (text === "/TRACK") {
            return sendMessage(chatId, "🔍 Send tracking number (ZUVO1001)");
        }

        // ---------------- TRACKING ----------------
        if (text.startsWith("ZUVO")) {
            try {
                const sheet = await getSheet();
                const rows = await sheet.getRows();

                const parcel = rows.find(r =>
                    String(r.Tracking).trim().toUpperCase() === text
                );

                if (!parcel) {
                    return sendMessage(chatId, "❌ Parcel not found");
                }

                return sendMessage(chatId,
                    `📦 <b>Parcel Found</b>\n\n` +
                    `Tracking: ${parcel.Tracking}\n` +
                    `Name: ${parcel.Name}\n` +
                    `Status: ${parcel.Status}\n` +
                    `Location: ${parcel.Location}\n` +
                    `Delivery: ${parcel.Delivery}`
                );

            } catch (err) {
                console.log("Sheet error:", err.message);
                return sendMessage(chatId, "❌ Error reading sheet");
            }
        }

        return res.sendStatus(200);

    } catch (err) {
        console.log("Webhook error:", err.message);
        res.sendStatus(200);
    }
});

// ===================== HOME =====================
app.get("/", (req, res) => {
    res.send("🚚 ZUVO Bot running ✅");
});

// ===================== START =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Bot running on port " + PORT);
});