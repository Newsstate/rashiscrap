import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Get Parameters
    // Astrosage uses D-M-YYYY (e.g., 5-1-2026)
    const dateParam = searchParams.get("date"); 
    const lang = searchParams.get("lang") === "hi" ? "hi" : "en";
    
    let formattedDate = "";
    if (dateParam && dateParam.includes("-")) {
      // If user sends YYYY-MM-DD, convert to D-M-YYYY
      const parts = dateParam.split("-");
      if (parts[0].length === 4) {
         formattedDate = `${parseInt(parts[2])}-${parseInt(parts[1])}-${parts[0]}`;
      } else {
         formattedDate = dateParam;
      }
    } else {
      const now = new Date();
      formattedDate = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
    }

    // 2. Construct URL (Astrosage specific)
    const url = `https://panchang.astrosage.com/panchang/aajkapanchang?date=${formattedDate}&language=${lang}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": lang === "hi" ? "hi-IN,hi;q=0.9" : "en-US,en;q=0.9"
      },
      cache: "no-store",
    });

    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const rawData: Record<string, string> = {};

    // 3. Astrosage Scraper Logic
    // Astrosage Panchang items are usually in .ui-grid-a or table rows
    const pItems = doc.querySelectorAll(".ui-grid-a, .ui-block-a, tr");
    
    pItems.forEach((item) => {
      // Logic for grid-based layout (Key in block-a, Value in block-b)
      const keyEl = item.querySelector(".ui-block-a") || item.querySelector("td:first-child") || item.querySelector("th");
      const valEl = item.querySelector(".ui-block-b") || item.querySelector("td:last-child");

      if (keyEl && valEl) {
        const key = keyEl.textContent?.trim().replace(/[:.]/g, "") || "";
        const val = valEl.textContent?.trim() || "";
        if (key) rawData[key] = val;
      }
    });

    // 4. Normalization Helper
    const find = (en: string, hi: string) => {
      const entry = Object.entries(rawData).find(([k]) => 
        k.toLowerCase().includes(en.toLowerCase()) || k.includes(hi)
      );
      return entry ? entry[1] : "N/A";
    };

    const panchang = {
      weekday: find("Day", "वार"),
      sunrise: find("Sunrise", "सूर्योदय"),
      sunset: find("Sunset", "सूर्यास्त"),
      tithi: {
        name: find("Tithi", "तिथि"),
      },
      nakshatra: {
        name: find("Nakshatra", "नक्षत्र"),
      },
      paksha: find("Paksha", "पक्ष"),
      moonsign: find("Moon", "चन्द्र राशि"),
      sunsign: find("Sun Sign", "सूर्य राशि"),
      vikram_samvat: find("Vikram", "विक्रम संवत"),
      shaka_samvat: find("Shaka", "शक संवत"),
      month: {
        purnimanta: find("Purnimanta", "पूर्णिमान्त"),
        amanta: find("Amanta", "अमान्त")
      }
    };

    return NextResponse.json(
      { success: true, source: "Astrosage", date: formattedDate, lang, panchang },
      { headers: CORS_HEADERS }
    );

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
