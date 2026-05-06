import Papa from "papaparse";

export type Column<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

export function toCsv<T>(rows: T[], columns: Column<T>[]): string {
  const fields = columns.map((c) => c.header);
  const data = rows.map((row) => {
    const obj: Record<string, string | number> = {};
    for (const col of columns) {
      const v = col.value(row);
      obj[col.header] = v == null ? "" : v;
    }
    return obj;
  });
  return Papa.unparse({ fields, data }, { quotes: true, delimiter: ";" }).replace(/\r\n/g, "\n").trimEnd();
}
