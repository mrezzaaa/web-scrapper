import puppeteer, { Browser, Page } from "puppeteer";

export interface ScrapedBusiness {
  title: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  hasWebsite: boolean;
  rating: number | null;
}

/**
 * Delays execution for a given number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scrolls the Google Maps feed container to load more results.
 */
async function scrollFeed(page: Page, maxScrolls = 15): Promise<void> {
  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => {
      const feed = document.querySelector('div[role="feed"]');
      if (feed) {
        feed.scrollTop += 1200;
      }
    });
    await delay(1200);

    // Check if we've reached the end of results
    const ended = await page.evaluate(() => {
      const endText = document.querySelector(".HlvSq");
      return endText !== null;
    });
    if (ended) break;
  }
}

/**
 * Scrapes Google Maps for businesses matching the query and location.
 */
export async function scrapeGoogleMaps(
  query: string,
  location: string
): Promise<ScrapedBusiness[]> {
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--lang=id-ID,id",
        "--accept-lang=id-ID,id",
      ],
    });

    const page = await browser.newPage();

    // Set language to Indonesian to get consistent results
    await page.setExtraHTTPHeaders({
      "Accept-Language": "id-ID,id;q=0.9",
    });

    await page.setViewport({ width: 1280, height: 900 });

    const searchQuery = encodeURIComponent(`${query} ${location}`);
    const url = `https://www.google.com/maps/search/${searchQuery}`;

    console.log(`[Scraper] Navigating to: ${url}`);

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for the feed to appear
    try {
      await page.waitForSelector('div[role="feed"]', { timeout: 15000 });
    } catch {
      console.log("[Scraper] Feed selector not found, trying alternative...");
    }

    await delay(2000);

    // Scroll to load more results
    await scrollFeed(page, 15);

    // Extract all business cards
    const businesses = await page.evaluate(() => {
      const results: Array<{
        title: string;
        category: string | null;
        address: string | null;
        phone: string | null;
        website: string | null;
        hasWebsite: boolean;
        rating: number | null;
      }> = [];

      // Select all listing cards from the feed
      const cards = document.querySelectorAll(
        'div[role="feed"] > div > div[jsaction]'
      );

      cards.forEach((card) => {
        // Title
        const titleEl = card.querySelector(".qBF1Pd, .fontHeadlineSmall");
        const title = titleEl?.textContent?.trim() ?? null;
        if (!title) return;

        // Category
        const categoryEl = card.querySelector(
          ".W4Efsd:nth-child(1) > .W4Efsd > span:first-child, .DkEaL"
        );
        const category = categoryEl?.textContent?.trim() ?? null;

        // Address — look for address-like text in the card spans
        let address: string | null = null;
        const spans = card.querySelectorAll(".W4Efsd span, .UsdlK");
        spans.forEach((span) => {
          const text = span.textContent?.trim() ?? "";
          // Addresses usually contain common Indonesian address keywords or road patterns
          if (
            !address &&
            text.length > 5 &&
            (text.includes("Jl.") ||
              text.includes("Jalan") ||
              text.includes("No.") ||
              text.includes("Gg.") ||
              text.includes("Komp.") ||
              text.includes("Blok") ||
              text.match(/\d{5}/) || // postal code
              (text.includes(",") && text.length > 15))
          ) {
            address = text;
          }
        });

        // Rating
        const ratingEl = card.querySelector(".MW4etd");
        const ratingText = ratingEl?.textContent?.trim();
        const rating = ratingText ? parseFloat(ratingText) : null;

        // Check for website link
        const websiteLink = card.querySelector('a[data-value="Website"]');
        const hasWebsite = websiteLink !== null;
        const website = hasWebsite
          ? websiteLink?.getAttribute("href") ?? null
          : null;

        // Phone — look for tel: links or specific span classes
        let phone: string | null = null;
        const phoneLink = card.querySelector('a[href^="tel:"]');
        if (phoneLink) {
          phone = phoneLink.getAttribute("href")?.replace("tel:", "") ?? null;
        } else {
          // Look at .UsdlK or other spans for phone patterns
          const spans = card.querySelectorAll(".W4Efsd span, .UsdlK");
          spans.forEach((span) => {
            const text = span.textContent?.trim() ?? "";
            // Matches typical Indonesian/International numbers: 08xx-xxxx-xxxx, +62 xxx, etc.
            if (!phone && (text.match(/^(08|\+62)\d{2,3}[- ]?\d{3,4}[- ]?\d{3,4}$/) || text.match(/^0\d{2,3}[- ]?\d{5,8}$/))) {
              phone = text;
            }
          });
        }

        results.push({
          title,
          category,
          address,
          phone,
          website,
          hasWebsite,
          rating,
        });
      });

      return results;
    });

    console.log(`[Scraper] Found ${businesses.length} businesses.`);
    return businesses;
  } catch (error) {
    console.error("[Scraper] Error during scraping:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
