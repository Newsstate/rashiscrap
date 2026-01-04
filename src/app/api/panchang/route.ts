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
    const dateParam = searchParams.get("date"); // Expects YYYY-MM-DD
    const lang = (searchParams.get("lang") || "en").toLowerCase();

    // 1. Date Formatting: Convert YYYY-MM-DD to DD/MM/YYYY for Drik Panchang
    let formattedDate = "";
    if (dateParam && dateParam.includes("-")) {
      const [y, m, d] = dateParam.split("-");
      formattedDate = `${d}/${m}/${y}`;
    } else {
      const now = new Date();
      formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    }

    const langPath = lang === "hi" ? "/hindi" : "";
    const url = `https://www.drikpanchang.com${langPath}/panchang/day-panchang.html?date=${formattedDate}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      cache: "no-store",
    });

    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const rawData: Record<string, string> = {};

    // 2. Multi-Column Scraper Logic
    // This finds every row and checks if it has 2 cells (Key-Value) or 4 cells (Key-Value-Key-Value)
    const rows = doc.querySelectorAll("tr");
    
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td, th");
      
      if (cells.length >= 2) {
        // First pair in the row
        const key1 = cells[0].textContent?.trim().replace(/[:.]/g, "") || "";
        const val1 = cells[1].textContent?.trim() || "";
        if (key1) rawData[key1] = val1;
      }
      
      if (cells.length >= 4) {
        // Second pair in the same row (found in the 4-column layout)
        const key2 = cells[2].textContent?.trim().replace(/[:.]/g, "") || "";
        const val2 = cells[3].textContent?.trim() || "";
        if (key2) rawData[key2] = val2;
      }
    });

    // 3. Robust Data Mapping (Normalization)
    // Helper to find value regardless of slight variations in naming
    const find = (en: string, hi: string) => {
      const entry = Object.entries(rawData).find(([k]) => 
        k.toLowerCase().includes(en.toLowerCase()) || k.includes(hi)
      );
      return entry ? entry[1] : "N/A";
    };

    // Extracting Month names specifically from the "चन्द्रमास" or "Month" fields
    const purnimanta = find("Purnimanta", "पूर्णिमान्त");
    const amanta = find("Amanta", "अमान्त");

    const panchang = {
      weekday: find("Weekday", "वार"),
      sunrise: find("Sunrise", "सूर्योदय"),
      sunset: find("Sunset", "सूर्यास्त"),
      tithi: {
        name: find("Tithi", "तिथि"),
      },
      nakshatra: {
        name: find("Nakshatra", "नक्षत्र"),
      },
      paksha: find("Paksha", "पक्ष"),
      moonsign: find("Moon Sign", "चन्द्र राशि"),
      sunsign: find("Sun Sign", "सूर्य राशि"),
      vikram_samvat: find("Vikram Samvat", "विक्रम संवत"),
      shaka_samvat: find("Shaka Samvat", "शक संवत"),
      month: {
        purnimanta: purnimanta !== "N/A" ? purnimanta : find("Month", "चन्द्रमास"),
        amanta: amanta
      }
    };

    return NextResponse.json(
      { success: true, date: formattedDate, lang, panchang },
      { headers: CORS_HEADERS }
    );

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
