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

// ===================== NORMALIZE =====================
function normalizeText(text) {
    return String(text || "").trim().toUpperCase();
}

function normalizePhone(phone) {
    return String(phone || "").replace(/\s|-/g, "");
}

// ===================== WEBHOOK =====================
app.post("/webhook", async (req, res) => {

    // RESPOND TO TELEGRAM IMMEDIATELY
    res.sendStatus(200);

    try {

        console.log("🔥 WEBHOOK HIT");

        const update = req.body;

        if (!update.message || !update.message.text) {
            return;
        }

        const chatId = update.message.chat.id;
        const textRaw = update.message.text.trim();

        console.log("MESSAGE:", textRaw);

        // ================= COMMANDS =================

        if (textRaw === "/start") {

            await sendMessage(chatId,
`🚚 Welcome to ZUVO Parcel Tracking! 🚚

Your trusted delivery partner in Maldives.

Available Commands:
/track - Track by tracking number
/phone - Search by phone number
/help - Get help

Type /track or /phone to get started!`
            );

            return;
        }

        if (textRaw === "/help") {

            await sendMessage(chatId,
`📦 Commands:

/track - Track parcel
/phone - Search by phone number
/help - Help menu`
            );

            return;
        }

        // ================= TRACKING SEARCH =================

        const sheet = await getSheet();

        const rows = await sheet.getRows();

        const search = textRaw.trim().toUpperCase();

        const parcel = rows.find(r => {

            const tracking = String(
                r.Tracking ||
                r.tracking ||
                ""
            ).trim().toUpperCase();

            return tracking === search;

        });

        if (!parcel) {

            await sendMessage(chatId,
                "❌ Parcel not found"
            );

            return;
        }

        await sendMessage(chatId,
`📦 Parcel Found

Tracking: ${parcel.Tracking}

Name: ${parcel.Name}

Status: ${parcel.Status}

Location: ${parcel.Location}

Delivery: ${parcel.Delivery}`
        );

    } catch (err) {

        console.log("ERROR:");
        console.log(err);

    }

});

        // ===================== WELCOME =====================
        if (text === "/START") {
            await sendMessage(
                chatId,
`🚚 <b>Welcome to ZUVO Parcel Tracking! 🚚</b>

Your trusted delivery partner in Maldives.

<b>Available Commands:</b>
/track - Track by tracking number
/phone - Search by phone number
/help - Get help

Type /track or /phone to get started!`
            );
            return;
        }

        // ===================== HELP =====================
        if (text === "/HELP") {
            await sendMessage(
                chatId,
`📦 <b>Help Menu</b>

/track - Track parcel by tracking number
/phone - Find parcels using phone number
/cancel - Stop current action`
            );
            return;
        }

        // ===================== TRACK START =====================
        if (text === "/TRACK") {
            await sendMessage(chatId, "🔍 Please enter your tracking number:");
            return;
        }

        // ===================== PHONE START =====================
        if (text === "/PHONE") {
            await sendMessage(chatId, "📱 Please enter your phone number:");
            return;
        }

        // ===================== TRACKING SEARCH (ANY FORMAT) =====================
        if (textRaw && textRaw.length >= 3 && /[A-Z0-9]/i.test(textRaw)) {
            const sheet = await getSheet();
            const rows = await sheet.getRows();

            const search = normalizeText(textRaw);

            const parcel = rows.find(r => {
                const tracking = normalizeText(r.Tracking || r.TRACKING || r.tracking);
                return tracking === search;
            });

            if (!parcel) {
                await sendMessage(chatId, "❌ No parcel found with that tracking number.");
                return;
            }

            await sendMessage(
                chatId,
`📦 <b>Parcel Found</b>

<b>Tracking:</b> ${parcel.Tracking}
<b>Name:</b> ${parcel.Name}
<b>Status:</b> ${parcel.Status}
<b>Location:</b> ${parcel.Location}
<b>Delivery:</b> ${parcel.Delivery}`
            );
            return;
        }

        // ===================== PHONE SEARCH =====================
        if (/^\d{5,15}$/.test(normalizePhone(textRaw))) {
            const sheet = await getSheet();
            const rows = await sheet.getRows();

            const phone = normalizePhone(textRaw);

            const results = rows.filter(r => {
                const dbPhone = normalizePhone(r.Phone || r.PHONE || r.phone);
                return dbPhone === phone;
            });

            if (results.length === 0) {
                await sendMessage(chatId, "❌ No parcels found for this phone number.");
                return;
            }

            let msg = `📱 <b>${results.length} Parcel(s) Found</b>\n\n`;

            results.forEach((p, i) => {
                msg +=
`${i + 1}. <b>${p.Tracking}</b>
Status: ${p.Status}
Location: ${p.Location}
Delivery: ${p.Delivery}\n\n`;
            });

            await sendMessage(chatId, msg);
            return;
        }

    } catch (err) {
        console.log("Webhook error:", err.message);
    }
});

// ===================== HOME =====================
app.get("/", (req, res) => {
    res.send("🚚 ZUVO Bot is running ✅");
});

// ===================== START =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Bot running on port " + PORT);
});