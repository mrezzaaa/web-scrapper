import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");
    if (!key) {
      return Response.json({ error: "Missing key parameter" }, { status: 400 });
    }

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    return Response.json({ value: setting?.value ?? null });
  } catch (error) {
    return Response.json({ error: "Failed to fetch setting" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json();
    
    if (!key || value === undefined) {
      return Response.json({ error: "Missing key or value" }, { status: 400 });
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return Response.json({ success: true, setting });
  } catch (error) {
    return Response.json({ error: "Failed to save setting" }, { status: 500 });
  }
}
