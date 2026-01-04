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
    const dateParam = searchParams.get("date"); 
    const lang = (searchParams.get("lang") || "en").toLowerCase();

    // 1. Format Date correctly for Drik Panchang (DD/MM/YYYY)
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36" 
      },
      cache: "no-store",
    });

    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const rawPanchang: Record<string, string> = {};

    // 2. NEW SELECTORS: Drik Panchang uses dpPanchangTable or key/value spans
    const rows = doc.querySelectorAll(".dpPanchangTable .dpPanchangRow, tr");
    
    rows.forEach((row) => {
      const keyEl = row.querySelector(".dpPanchangKey, th");
      const valEl = row.querySelector(".dpPanchangValue, td");
      
      if (keyEl && valEl) {
          // Clean the key: remove colons, dots, and extra spaces
          const key = keyEl.textContent?.replace(/[:.]/g, "").trim() || "";
          const value = valEl.textContent?.trim() || "";
          rawPanchang[key] = value;
      }
    });

    // 3. Robust Helper: Check if key exists anywhere in the string
    const getVal = (enKey: string, hiKey: string) => {
        // Search the rawPanchang keys for a partial match
        const foundKey = Object.keys(rawPanchang).find(k => 
            k.toLowerCase().includes(enKey.toLowerCase()) || 
            k.includes(hiKey)
        );
        return foundKey ? rawPanchang[foundKey] : "N/A";
    };

    const normalizedData = {
      date: formattedDate,
      weekday: getVal("Weekday", "आज का वार"),
      sunrise: getVal("Sunrise", "सूर्योदय"),
      sunset: getVal("Sunset", "सूर्यास्त"),
      tithi: { name: getVal("Tithi", "तिथि"), ends: "" },
      nakshatra: { name: getVal("Nakshatra", "नक्षत्र"), ends: "" },
      paksha: getVal("Paksha", "पक्ष"),
      moonsign: getVal("Moon Sign", "चन्द्र राशि"),
      sunsign: getVal("Sun Sign", "सूर्य राशि"),
      vikram_samvat: getVal("Vikram Samvat", "विक्रम संवत"),
      shaka_samvat: getVal("Shaka Samvat", "शक संवत"),
      month: {
          amanta: getVal("Amanta", "अमान्त"),
          purnimanta: getVal("Purnimanta", "पूर्णिमान्त")
      }
    };

    return NextResponse.json(
      { success: true, lang, ...normalizedData },
      { headers: CORS_HEADERS }
    );

  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
