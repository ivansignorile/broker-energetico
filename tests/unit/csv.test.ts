import { describe, it, expect } from "vitest";
import { toCsv } from "@/lib/csv/export";

type Row = { nome: string; eta: number; email: string | null };

describe("toCsv", () => {
  it("produces header + rows separated by ;", () => {
    const rows: Row[] = [
      { nome: "Alice", eta: 30, email: "a@x" },
      { nome: "Bob", eta: 25, email: null },
    ];
    const csv = toCsv(rows, [
      { header: "Nome", value: (r) => r.nome },
      { header: "Eta", value: (r) => r.eta },
      { header: "Email", value: (r) => r.email },
    ]);
    expect(csv.split("\n")[0]).toBe('"Nome";"Eta";"Email"');
    expect(csv).toContain('"Alice";"30";"a@x"');
    expect(csv).toContain('"Bob";"25";""');
  });

  it("handles empty rows", () => {
    const csv = toCsv<Row>([], [
      { header: "Nome", value: (r) => r.nome },
    ]);
    expect(csv).toBe('"Nome"');
  });
});
