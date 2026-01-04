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
    const dateParam = searchParams.get("date"); // Expecting YYYY-MM-DD
    const lang = (searchParams.get("lang") || "en").toLowerCase();

    // Drik Panchang uses DD/MM/YYYY in their query param
    let formattedDate = dateParam;
    if (dateParam && dateParam.includes("-")) {
        const [y, m, d] = dateParam.split("-");
        formattedDate = `${d}/${m}/${y}`;
    }

    const langPath = lang === "hi" ? "/hindi" : "";
    const url = `https://www.drikpanchang.com${langPath}/panchang/day-panchang.html?date=${formattedDate}`;

    const res = await fetch(url, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" 
      },
      cache: "no-store",
    });

    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // We collect raw data first
    const rawPanchang: Record<string, string> = {};
    doc.querySelectorAll("table.panchang_table tr").forEach((row) => {
      const th = row.querySelector("th")?.textContent?.trim();
      const td = row.querySelector("td")?.textContent?.trim();
      if (th && td) {
          // Remove colons from headers to make matching easier
          const key = th.replace(":", "");
          rawPanchang[key] = td;
      }
    });

    // NORMALIZATION: Map Hindi or English keys to standard frontend keys
    // This ensures your frontend code (data.sunrise) never breaks.
    const getVal = (enKey: string, hiKey: string) => rawPanchang[enKey] || rawPanchang[hiKey] || "N/A";

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
          amanta: getVal("Amanta Month", "अमान्त महीना"),
          purnimanta: getVal("Purnimanta Month", "पूर्णिमान्त महीना")
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
