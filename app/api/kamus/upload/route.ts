import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
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
    const session = await auth();
    const userId = session?.user?.id;

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

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Validation failed", errors: [{ row: 0, message: "No data rows found" }] },
        { status: 400 }
      );
    }

    const created: { id: string; code: string }[] = [];
    const updated: { id: string; code: string }[] = [];

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        const existing = await tx.kamusItem.findUnique({
          where: { code: row.code },
        });

        if (existing) {
          const result = await tx.kamusItem.update({
            where: { code: row.code },
            data: {
              name: row.name,
              type: row.type,
              description: row.description,
              behavioralIndicators: row.behavioralIndicators,
              updatedBy: userId ?? null,
            },
          });
          updated.push({ id: result.id, code: result.code });
        } else {
          const result = await tx.kamusItem.create({
            data: {
              code: row.code,
              name: row.name,
              type: row.type,
              description: row.description,
              behavioralIndicators: row.behavioralIndicators,
              createdBy: userId ?? null,
              updatedBy: userId ?? null,
            },
          });
          created.push({ id: result.id, code: result.code });
        }
      }

      await tx.kamusEvent.create({
        data: {
          type: "Kamus Submitted",
          payload: JSON.stringify({
            createdCount: created.length,
            updatedCount: updated.length,
            codes: rows.map((r) => r.code),
          }),
          createdBy: userId ?? null,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      event: "Kamus Submitted",
      created: created.length,
      updated: updated.length,
      total: rows.length,
    });
  } catch (error) {
    console.error("[API] POST /api/kamus/upload failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process upload: ${message}` },
      { status: 500 }
    );
  }
}
