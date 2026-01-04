import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

/* =========================
   CORS HEADERS
========================= */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/* =========================
   PREFLIGHT HANDLER
========================= */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/* =========================
   GET HANDLER
========================= */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // DD/MM/YYYY
    const lang = searchParams.get("lang") || "en";

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Drik Panchang URL
    const url = `https://www.drikpanchang.com/muhurat/choghadiya.html?date=${date}&lang=${lang}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch source page" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const choghadiya: {
      name: string;
      start: string;
      end: string;
    }[] = [];

    $("div.dpMuhurtaCard div.dpMuhurtaRow").each((_, el) => {
      const name = $(el)
        .find(".dpMuhurtaName .dpVerticalMiddleText")
        .text()
        .trim();

      const start = $(el)
        .find(".dpMuhurtaTime .dpVerticalMiddleText")
        .contents()
        .first()
        .text()
        .trim();

      const end = $(el)
        .find(".dpMuhurtaTime .dpInlineBlock")
        .text()
        .trim();

      if (name && start && end) {
        choghadiya.push({ name, start, end });
      }
    });

    return NextResponse.json(
      {
        success: true,
        date,
        lang,
        choghadiya,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
