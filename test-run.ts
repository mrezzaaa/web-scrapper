import { scrapeGoogleMaps } from "./app/lib/scraper";
async function run() {
  const r = await scrapeGoogleMaps("rental mobil", "depok");
  console.log(`Phones: ${r.filter(x => x.phone).length}/${r.length}`);
}
run();
