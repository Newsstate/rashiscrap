import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const app = express();
const PORT = 3000;

app.get("/api/mesha-horoscope", async (req, res) => {
  try {
    const url =
      "https://www.drikpanchang.com/astrology/prediction/mesha-rashi/mesha-rashi-daily-rashiphal.html?prediction-day=today";

    const response = await fetch(url);
    const html = await response.text();

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // First horoscope paragraph
    const para = doc.querySelector(".Rashifal p");

    res.json({
      success: true,
      text: para ? para.textContent.trim() : ""
    });
  } catch (e) {
    res.json({ success: false });
  }
});

app.listen(PORT, () =>
  console.log("Server running on http://localhost:" + PORT)
);
