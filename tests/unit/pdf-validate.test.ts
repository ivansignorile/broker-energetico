// tests/unit/pdf-validate.test.ts
import { describe, it, expect } from "vitest";
import { validatePdf } from "@/lib/pdf/validate";

function makeFile(bytes: number[], { name = "x.pdf", type = "application/pdf" } = {}): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

const PDF_HEAD = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37]; // %PDF-1.7

describe("validatePdf", () => {
  it("accepts valid pdf", async () => {
    const r = await validatePdf(makeFile(PDF_HEAD));
    expect(r.ok).toBe(true);
  });
  it("rejects wrong mime", async () => {
    const r = await validatePdf(makeFile(PDF_HEAD, { type: "image/png" }));
    expect(r.ok).toBe(false);
  });
  it("rejects oversize", async () => {
    const big = makeFile(PDF_HEAD.concat(new Array(11 * 1024 * 1024).fill(0)));
    const r = await validatePdf(big, 10);
    expect(r.ok).toBe(false);
  });
  it("rejects bad magic bytes", async () => {
    const r = await validatePdf(makeFile([0x00, 0x01, 0x02, 0x03]));
    expect(r.ok).toBe(false);
  });
  it("rejects empty file", async () => {
    const r = await validatePdf(makeFile([]));
    expect(r.ok).toBe(false);
  });
});
