export type RegionRow = {
  sdCd: string | null;
  sdNm: string | null;
  sggCd: string | null;
  sggNm: string | null;
  emdCd: string | null;
  emdNm: string | null;
};

export type RegionOption = {
  code: string;
  name: string;
};

type RegionCodeField = "sdCd" | "sggCd" | "emdCd";
type RegionNameField = "sdNm" | "sggNm" | "emdNm";

function readCode(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function readName(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseRegionRows(data: unknown): RegionRow[] {
  if (!isRecord(data) || !Array.isArray(data.result)) return [];

  return data.result.filter(isRecord).map((record) => ({
    sdCd: readCode(record.sdCd),
    sdNm: readName(record.sdNm),
    sggCd: readCode(record.sggCd),
    sggNm: readName(record.sggNm),
    emdCd: readCode(record.emdCd),
    emdNm: readName(record.emdNm),
  }));
}

export function regionOptions(
  rows: RegionRow[],
  codeField: RegionCodeField,
  nameField: RegionNameField,
): RegionOption[] {
  const seen = new Set<string>();
  const options: RegionOption[] = [];

  for (const row of rows) {
    const code = row[codeField];
    const name = row[nameField];
    if (!code || !name) continue;

    const identity = JSON.stringify([code, name]);
    if (seen.has(identity)) continue;
    seen.add(identity);
    options.push({ code, name });
  }

  return options;
}
