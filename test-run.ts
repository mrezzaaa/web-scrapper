import { scrapeGoogleMaps } from "./app/lib/scraper";
async function run() {
  const r = await scrapeGoogleMaps("nail", "depok");
  console.log(`Phones: ${r.filter(x => x.phone).length}/${r.length}`);
}
run();
