import { NextRequest } from "next/server";
import { scrapeGoogleMaps } from "@/app/lib/scraper";
import { prisma } from "@/app/lib/prisma";

export const maxDuration = 120; // Allow up to 2 minutes for scraping

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location } = body as { query?: string; location?: string };

    if (!query || !location) {
      return Response.json(
        { error: "Parameter 'query' dan 'location' wajib diisi." },
        { status: 400 }
      );
    }

    console.log(`[API/scrape] Starting scrape: "${query}" di "${location}"`);

    const businesses = await scrapeGoogleMaps(query, location);

    if (businesses.length === 0) {
      return Response.json(
        {
          success: true,
          message: "Scraping selesai, namun tidak ada hasil yang ditemukan.",
          count: 0,
          saved: 0,
        },
        { status: 200 }
      );
    }

    const locationQuery = `${query} ${location}`;
    let savedCount = 0;

    for (const biz of businesses) {
      try {
        // Avoid duplicates: only create if title+locationQuery doesn't exist yet
        const existing = await prisma.lead.findFirst({
          where: {
            title: biz.title,
            locationQuery,
          },
        });

        if (!existing) {
          await prisma.lead.create({
            data: {
              title: biz.title,
              category: biz.category,
              address: biz.address,
              phone: biz.phone,
              website: biz.website,
              hasWebsite: biz.hasWebsite,
              rating: biz.rating,
              locationQuery,
            },
          });
          savedCount++;
        }
      } catch (err) {
        console.error("[API/scrape] Failed to save lead:", biz.title, err);
      }
    }

    return Response.json(
      {
        success: true,
        message: `Scraping selesai! Ditemukan ${businesses.length} bisnis, ${savedCount} baru disimpan ke database.`,
        count: businesses.length,
        saved: savedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API/scrape] Unhandled error:", error);
    return Response.json(
      {
        error: "Terjadi kesalahan saat scraping.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
