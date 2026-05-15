export type KamusType = "potensi" | "kompetensi";

export interface KamusRow {
  code: string;
  name: string;
  type: KamusType;
  description: string;
  behavioralIndicators: string;
}

export interface RowError {
  row: number;
  message: string;
}

export interface ParseResult {
  rows: KamusRow[];
  errors: RowError[];
}

export const KAMUS_TEMPLATE_HEADER = [
  "code",
  "name",
  "type",
  "description",
  "behavioralIndicators",
] as const;

export const KAMUS_TEMPLATE_CSV =
  KAMUS_TEMPLATE_HEADER.join(",") +
  "\n" +
  [
    "POT-001,Problem Solving,potensi,Ability to solve problems,Analyzes issues|Proposes solutions|Implements fixes",
    "KOM-001,Leadership,kompetensi,Leading others effectively,Sets direction|Coaches team|Drives results",
  ].join("\n") +
  "\n";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === ",") {
        result.push(current);
        current = "";
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result.map((c) => c.trim());
}

export function parseKamusCsv(content: string): ParseResult {
  const rows: KamusRow[] = [];
  const errors: RowError[] = [];

  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { rows, errors: [{ row: 0, message: "File is empty" }] };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const required = KAMUS_TEMPLATE_HEADER.map((h) => h.toLowerCase());
  const missing = required.filter((r) => !header.includes(r));
  if (missing.length > 0) {
    return {
      rows,
      errors: [
        {
          row: 1,
          message: `Header missing required columns: ${missing.join(", ")}`,
        },
      ],
    };
  }

  const idx = {
    code: header.indexOf("code"),
    name: header.indexOf("name"),
    type: header.indexOf("type"),
    description: header.indexOf("description"),
    behavioralIndicators: header.indexOf("behavioralindicators"),
  };

  const seenCodes = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const cells = parseCsvLine(lines[i]);
    const code = cells[idx.code]?.trim() ?? "";
    const name = cells[idx.name]?.trim() ?? "";
    const typeRaw = cells[idx.type]?.trim().toLowerCase() ?? "";
    const description = cells[idx.description]?.trim() ?? "";
    const behavioralIndicators = cells[idx.behavioralIndicators]?.trim() ?? "";

    const missingFields: string[] = [];
    if (!code) missingFields.push("code");
    if (!name) missingFields.push("name");
    if (!typeRaw) missingFields.push("type");
    if (!description) missingFields.push("description");
    if (!behavioralIndicators) missingFields.push("behavioralIndicators");

    if (missingFields.length > 0) {
      errors.push({
        row: rowNum,
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
      continue;
    }

    if (typeRaw !== "potensi" && typeRaw !== "kompetensi") {
      errors.push({
        row: rowNum,
        message: `Invalid type "${typeRaw}". Must be "potensi" or "kompetensi".`,
      });
      continue;
    }

    if (seenCodes.has(code)) {
      errors.push({
        row: rowNum,
        message: `Duplicate code "${code}" in uploaded file.`,
      });
      continue;
    }
    seenCodes.add(code);

    rows.push({
      code,
      name,
      type: typeRaw as KamusType,
      description,
      behavioralIndicators,
    });
  }

  return { rows, errors };
}
