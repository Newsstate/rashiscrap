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

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const dateStr = dateParam || `${dd}/${mm}/${yyyy}`;

    const langPath = lang === "hi" ? "/hindi" : "";
    const url = `https://www.drikpanchang.com${langPath}/panchang/day-panchang.html?date=${dateStr}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });

    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const panchangData: Record<string, string> = {};

    doc.querySelectorAll("table.panchang_table tr").forEach((row) => {
      const th = row.querySelector("th")?.textContent?.trim();
      const td = row.querySelector("td")?.textContent?.trim();
      if (th && td) panchangData[th] = td;
    });

    return NextResponse.json(
      {
        date: dateStr,
        lang,
        panchang: panchangData,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
