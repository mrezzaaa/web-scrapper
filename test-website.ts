import puppeteer from "puppeteer";
async function testScrape() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ "Accept-Language": "id-ID,id;q=0.9" });
  await page.goto("https://www.google.com/maps/search/Klinik+Gigi+Depok", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 5000));
  
  const html = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div[role="feed"] > div > div[jsaction]'));
    let out = "";
    cards.slice(0, 5).forEach(c => {
       const title = c.querySelector(".qBF1Pd, .fontHeadlineSmall")?.textContent;
       const links = Array.from(c.querySelectorAll('a')).map(a => `${a.textContent?.trim()} - ${a.getAttribute('href')}`);
       out += `Title: ${title}\nLinks: ${links.join(', ')}\n\n`;
    });
    return out;
  });
  console.log(html);
  await browser.close();
}
testScrape();
