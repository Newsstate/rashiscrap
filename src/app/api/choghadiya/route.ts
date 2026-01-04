import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // format: DD/MM/YYYY
    if (!date)
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );

    const url = `https://www.drikpanchang.com/muhurat/choghadiya.html?date=${date}`;
    const res = await fetch(url);
    if (!res.ok)
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );

    const html = await res.text();
    const $ = cheerio.load(html);

    const choghadiyaData: { name: string; start: string; end: string }[] = [];

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

      const end = $(el).find(".dpMuhurtaTime .dpInlineBlock").text().trim();

      choghadiyaData.push({ name, start, end });
    });

    return NextResponse.json(
      { date, choghadiya: choghadiyaData },
      {
        headers: {
          "Access-Control-Allow-Origin": "*", // ✅ allow all origins
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}
