import { NextResponse } from "next/server";
import cheerio from "cheerio";

export const runtime = "nodejs"; // IMPORTANT for cheerio

export async function GET() {
  try {
    const url =
      "https://www.drikpanchang.com/astrology/prediction/mesha-rashi/mesha-rashi-daily-rashiphal.html?prediction-day=today";

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HoroscopeBot/1.0; +https://yourdomain.com)",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch source");
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    /**
     * Drik Panchang structure:
     * Daily horoscope text is inside content paragraphs
     * We safely grab the FIRST meaningful paragraph
     */

    let horoscope = "";

    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 120 && !horoscope) {
        horoscope = text;
      }
    });

    if (!horoscope) {
      throw new Error("Horoscope not found");
    }

    return NextResponse.json({
      sign: "Mesha (Aries)",
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      horoscope,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load horoscope" },
      { status: 500 }
    );
  }
}
