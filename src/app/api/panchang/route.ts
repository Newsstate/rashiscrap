import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

export const runtime = "nodejs";
export const revalidate = 1800; // cache 30 min

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || "5-1-2026";
    const language = searchParams.get("language") || "hi";
    const lid = searchParams.get("lid") || "1261481";

    const url = `https://panchang.astrosage.com/panchang/aajkapanchang?date=${date}&language=${language}&lid=${lid}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });

    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    /* ---------- PAGE TITLE ---------- */
    const title =
      document.querySelector(".main-title h2")?.textContent?.trim() || "";

    /* ---------- PANCHANG DATA ---------- */
    const panchang: Record<string, string> = {};

    document.querySelectorAll(".pan-row").forEach((row) => {
      const label = row
        .querySelector(".col-xs-5 b")
        ?.textContent?.trim();

      const value = row
        .querySelector(".col-xs-7")
        ?.textContent?.replace(/\s+/g, " ")
        .trim();

      if (label && value) {
        panchang[label] = value;
      }
    });

    return NextResponse.json(
      {
        success: true,
        source: "astrosage",
        title,
        date,
        language,
        panchang,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch Panchang" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
