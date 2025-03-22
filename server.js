const express = require("express");
const cors = require("cors");
const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const webhookUrl = "https://discord.com/api/webhooks/1352972685889638400/aAmcnD_FBJEq9aj7cmekEFDZTuoUCCoI1zmGsrDsN1d68eqwcqy3_fdFdQbqIjoStpnF";
const busyFile = "busy.json";

app.use(cors());
app.use(express.json());

// ✅ เสิร์ฟไฟล์ HTML, CSS, JS
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});
app.get("/script.js", (req, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});

// ✅ สร้าง busy.json ถ้ายังไม่มี
if (!fs.existsSync(busyFile)) {
  fs.writeFileSync(busyFile, "[]");
}

// ✅ API รับแจ้งไม่ว่าง
app.post("/busy", async (req, res) => {
  try {
    const { name, location, reason, until } = req.body;

    if (!name || !location || !reason || !until) {
      return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบ" });
    }

    const today = new Date();
    const [hour, minute] = until.split(":");
    const untilDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);
    const untilText = untilDate.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const current = JSON.parse(fs.readFileSync(busyFile));
    current.push({ name, location, reason, until, timestamp: new Date().toISOString() });
    fs.writeFileSync(busyFile, JSON.stringify(current, null, 2));

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Busy Bot",
        embeds: [
          {
            title: `🚫 ${name} ไม่ว่างตอนนี้`,
            color: 0xff5555,
            fields: [
              { name: "📍 ไปที่ไหน", value: location, inline: true },
              { name: "📝 ธุระอะไร", value: reason, inline: true },
              { name: "⏰ กลับมาประมาณ", value: untilText, inline: true },
            ],
            footer: {
              text: "แจ้งโดย NotiAway",
            },
            timestamp: new Date().toISOString()
          }
        ]
      }),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ success: false, message: "ไม่สามารถแจ้งสถานะได้" });
  }
});

// ✅ เปิดเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`✅ NotiAway Server running on http://localhost:${PORT}`);
});
