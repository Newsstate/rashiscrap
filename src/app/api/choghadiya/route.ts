import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // format: DD/MM/YYYY
    if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

    const url = `https://www.drikpanchang.com/muhurat/choghadiya.html?date=${date}`;
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });

    const html = await res.text();
    const $ = cheerio.load(html);

    const choghadiyaData: { name: string; start: string; end: string }[] = [];

    $("div.dpMuhurtaCard div.dpMuhurtaRow").each((_, el) => {
      const name = $(el).find(".dpMuhurtaName .dpVerticalMiddleText").text().trim();

      // start time = first text node inside .dpVerticalMiddleText
      const start = $(el)
        .find(".dpMuhurtaTime .dpVerticalMiddleText")
        .contents()
        .first()
        .text()
        .trim();

      // end time = text inside .dpInlineBlock
      const end = $(el).find(".dpMuhurtaTime .dpInlineBlock").text().trim();

      choghadiyaData.push({ name, start, end });
    });

    return NextResponse.json({ date, choghadiya: choghadiyaData });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
