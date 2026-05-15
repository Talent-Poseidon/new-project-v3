import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseKamusCsv } from "@/lib/kamus/parser";

export const dynamic = "force-dynamic";

async function readBody(request: NextRequest): Promise<string | null> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (file && typeof file !== "string") {
      return await file.text();
    }
    return null;
  }
  return await request.text();
}

export async function POST(request: NextRequest) {
  try {
    const content = await readBody(request);
    if (!content) {
      return NextResponse.json(
        { error: "No file content provided" },
        { status: 400 }
      );
    }

    const { rows, errors } = parseKamusCsv(content);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    const existing = await prisma.kamusItem.findMany();
    const existingByCode = new Map(existing.map((i) => [i.code, i]));
    const incomingCodes = new Set(rows.map((r) => r.code));

    const newItems: typeof rows = [];
    const changedItems: Array<{
      code: string;
      before: { name: string; type: string };
      after: { name: string; type: string };
    }> = [];
    const unchangedItems: typeof rows = [];
    const deletedItems: { code: string; name: string }[] = [];

    for (const row of rows) {
      const ex = existingByCode.get(row.code);
      if (!ex) {
        newItems.push(row);
      } else if (
        ex.name !== row.name ||
        ex.type !== row.type ||
        ex.description !== row.description ||
        ex.behavioralIndicators !== row.behavioralIndicators
      ) {
        changedItems.push({
          code: row.code,
          before: { name: ex.name, type: ex.type },
          after: { name: row.name, type: row.type },
        });
      } else {
        unchangedItems.push(row);
      }
    }

    for (const ex of existing) {
      if (!incomingCodes.has(ex.code)) {
        deletedItems.push({ code: ex.code, name: ex.name });
      }
    }

    return NextResponse.json({
      ok: true,
      summary: {
        new: newItems.length,
        changed: changedItems.length,
        unchanged: unchangedItems.length,
        deleted: deletedItems.length,
      },
      newItems,
      changedItems,
      deletedItems,
    });
  } catch (error) {
    console.error("[API] POST /api/kamus/preview failed:", error);
    return NextResponse.json(
      { error: "Failed to preview changes" },
      { status: 500 }
    );
  }
}
