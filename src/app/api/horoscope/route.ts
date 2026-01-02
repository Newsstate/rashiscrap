import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type"
};

// Zodiac slugs for Drik Panchang
const ZODIAC_URLS: Record<string, string> = {
  aries: "mesha-rashi",
  taurus: "vrishabha-rashi",
  gemini: "mithuna-rashi",
  cancer: "karka-rashi",
  leo: "simha-rashi",
  virgo: "kanya-rashi",
  libra: "tula-rashi",
  scorpio: "vrishchika-rashi",
  sagittarius: "dhanu-rashi",
  capricorn: "makara-rashi",
  aquarius: "kumbha-rashi",
  pisces: "meen-rashi"
};

export async function GET(request: Request) {
  try {
    const urlParams = new URL(request.url).searchParams;
    const sign = (urlParams.get("sign") || "aries").toLowerCase();
    const day = (urlParams.get("day") || "today").toLowerCase();
    const lang = (urlParams.get("lang") || "en").toLowerCase();

    if (!ZODIAC_URLS[sign]) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid zodiac sign" }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const rashiSlug = ZODIAC_URLS[sign];
    const langPath = lang === "hi" ? "/hindi" : "";
    const url = `https://www.drikpanchang.com/astrology/prediction/${rashiSlug}/${rashiSlug}-daily-rashiphal.html?prediction-day=${day}-&lang=hi&ck=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HoroscopeBot/1.0; +https://example.com)"
      },
      cache: "no-store"
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    let horoscope = "";
    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 120 && !horoscope) {
        horoscope = text;
      }
    });

    if (!horoscope) {
      return new NextResponse(
        JSON.stringify({ error: "Horoscope not found" }),
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return new NextResponse(
      JSON.stringify({
        sign,
        day,
        lang,
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }),
        horoscope
      }),
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
