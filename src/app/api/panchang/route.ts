import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function GET(request: Request) {
  try {
    const urlParams = new URL(request.url).searchParams;
    const dateParam = urlParams.get("date");
    const lang = (urlParams.get("lang") || "en").toLowerCase();

    // Format date as DD/MM/YYYY
    const today = new Date();
    const dd = String(today.getDate()).padStart(2,'0');
    const mm = String(today.getMonth()+1).padStart(2,'0');
    const yyyy = today.getFullYear();
    const dateStr = dateParam || `${dd}/${mm}/${yyyy}`;

    // Hindi page uses /hindi/ path
    const langPath = lang === "hi" ? "/hindi" : "";
    const url = `https://www.drikpanchang.com${langPath}/panchang/day-panchang.html?date=${dateStr}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PanchangBot/1.0; +https://example.com)"
      },
      cache: "no-store"
    });

    if (!res.ok) throw new Error("Failed to fetch Panchang");

    const html = await res.text();
    const $ = cheerio.load(html);

    const panchangData: Record<string,string> = {};

    // Scrape table rows
    $(".panchang-table tr").each((_, el) => {
      const key = $(el).find("th").text().trim();
      const val = $(el).find("td").text().trim();
      if(key && val){
        panchangData[key] = val;
      }
    });

    return new NextResponse(
      JSON.stringify({
        date: dateStr,
        lang,
        panchang: panchangData
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
