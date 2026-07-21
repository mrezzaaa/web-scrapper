import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hasWebsiteParam = searchParams.get("hasWebsite");
    const searchQuery = searchParams.get("q") ?? "";
    const locationFilter = searchParams.get("location") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      hasWebsite?: boolean;
      OR?: Array<{ title?: { contains: string }; locationQuery?: { contains: string }; category?: { contains: string } }>;
      locationQuery?: { contains: string };
    } = {};

    if (hasWebsiteParam === "false") {
      where.hasWebsite = false;
    } else if (hasWebsiteParam === "true") {
      where.hasWebsite = true;
    }

    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery } },
        { locationQuery: { contains: searchQuery } },
        { category: { contains: searchQuery } },
      ];
    }

    if (locationFilter) {
      where.locationQuery = { contains: locationFilter };
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return Response.json(
      {
        leads,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API/leads] Error fetching leads:", error);
    return Response.json(
      {
        error: "Gagal mengambil data leads.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      await prisma.lead.deleteMany({});
      return Response.json({ success: true, message: "Semua data lead berhasil dihapus." });
    }

    if (!id) {
      return Response.json({ error: "ID lead wajib diisi." }, { status: 400 });
    }

    await prisma.lead.delete({ where: { id } });

    return Response.json({ success: true, message: "Lead berhasil dihapus." });
  } catch (error) {
    return Response.json(
      {
        error: "Gagal menghapus lead.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
