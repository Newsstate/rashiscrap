import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

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

    const today = new Date();
    const dd = String(today.getDate()).padStart(2,'0');
    const mm = String(today.getMonth()+1).padStart(2,'0');
    const yyyy = today.getFullYear();
    const dateStr = dateParam || `${dd}/${mm}/${yyyy}`;

    const langPath = lang === "hi" ? "/hindi" : "";
    const url = `https://www.drikpanchang.com${langPath}/panchang/day-panchang.html?date=${dateStr}`;

    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Scrape all rows
    const panchangData = await page.evaluate(() => {
      const data: Record<string,string> = {};
      document.querySelectorAll('table.panchang_table tr').forEach(row => {
        const th = row.querySelector('th')?.textContent?.trim();
        const td = row.querySelector('td')?.textContent?.trim();
        if(th && td){
          data[th] = td;
        }
      });

      // fallback for divs
      document.querySelectorAll('.panchang-detail').forEach(div => {
        const k = div.querySelector('.panchang-label')?.textContent?.trim();
        const v = div.querySelector('.panchang-value')?.textContent?.trim();
        if(k && v) data[k] = v;
      });

      return data;
    });

    await browser.close();

    return new NextResponse(
      JSON.stringify({
        date: dateStr,
        lang,
        panchang: panchangData
      }),
      { headers: CORS_HEADERS }
    );

  } catch (err) {
    console.error(err);
    return new NextResponse(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
