import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const item = await prisma.kamusItem.findUnique({
      where: { id },
      include: {
        standarJabatanRefs: { include: { standarJabatan: true } },
        scenarioRefs: { include: { scenario: true } },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Kamus item not found" },
        { status: 404 }
      );
    }

    const standarUsages = item.standarJabatanRefs.map(
      (r) => r.standarJabatan.name
    );
    const scenarioUsages = item.scenarioRefs.map((r) => r.scenario.name);

    if (standarUsages.length > 0 || scenarioUsages.length > 0) {
      const parts: string[] = [];
      if (standarUsages.length > 0) {
        parts.push(`Standar Jabatan: ${standarUsages.join(", ")}`);
      }
      if (scenarioUsages.length > 0) {
        parts.push(`Scenario: ${scenarioUsages.join(", ")}`);
      }
      return NextResponse.json(
        {
          error: `Cannot delete Kamus "${item.code}" because it is used by ${parts.join("; ")}`,
          usedBy: { standarJabatan: standarUsages, scenarios: scenarioUsages },
        },
        { status: 409 }
      );
    }

    await prisma.kamusItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] DELETE /api/kamus/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete kamus" },
      { status: 500 }
    );
  }
}
