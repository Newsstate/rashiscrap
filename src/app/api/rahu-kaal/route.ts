import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // DD/MM/YYYY
    const lang = searchParams.get("lang") || "hi";

    const baseUrl = "https://www.drikpanchang.com/panchang/rahu-kaal.html";
    const url = date ? `${baseUrl}?date=${date}&lang=${lang}` : baseUrl;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch source page" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    /* ===============================
       EXTRACT DATA
    =============================== */

    const city = $(".dpPHeaderLeftWrapper > div:last-child")
      .text()
      .trim();

    const timingText = $(".dpMuhurtaCardTiming")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const [start, end] = timingText.split("से").map(t => t.trim());

    const infoText = $(".dpMuhurtaCardInfo")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const weekdayMatch = infoText.match(/(सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार|रविवार)/);

    const duration = $(".dpMuhurtaCardMessage")
      .first()
      .text()
      .replace("अवधि", "")
      .replace(/\s+/g, " ")
      .trim();

    return NextResponse.json(
      {
        date,
        city,
        weekday: weekdayMatch ? weekdayMatch[0] : "",
        rahukal: {
          start,
          end,
          duration,
        },
      },
      { headers: CORS_HEADERS }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
