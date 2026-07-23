import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where = q
      ? {
          OR: [
            { title: { contains: q } },
            { address: { contains: q } },
          ],
        }
      : {};

    const [history, total] = await Promise.all([
      prisma.contactedHistory.findMany({
        where,
        orderBy: { contactedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contactedHistory.count({ where }),
    ]);

    return Response.json({
      history,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("[API/history] Error fetching history:", error);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalLeadId, title, category, address, phone, formattedMessage } = body;

    if (!title || !phone) {
      return Response.json({ error: "Title and phone are required" }, { status: 400 });
    }

    const history = await prisma.contactedHistory.create({
      data: {
        originalLeadId,
        title,
        category,
        address,
        phone,
        formattedMessage,
      },
    });

    return Response.json({ success: true, history }, { status: 201 });
  } catch (error) {
    console.error("[API/history] Error saving history:", error);
    return Response.json({ error: "Failed to save history" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get("clearAll");
    const id = searchParams.get("id");

    if (clearAll === "true") {
      await prisma.contactedHistory.deleteMany({});
      return Response.json({ success: true, message: "Semua riwayat berhasil dihapus." });
    } else if (id) {
      await prisma.contactedHistory.delete({ where: { id } });
      return Response.json({ success: true, message: "Riwayat berhasil dihapus." });
    }

    return Response.json({ error: "Provide clearAll=true or id" }, { status: 400 });
  } catch (error) {
    console.error("[API/history] Error deleting history:", error);
    return Response.json({ error: "Failed to delete history" }, { status: 500 });
  }
}
