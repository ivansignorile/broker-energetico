import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: documenti", () => {
  let admin: TestUser;
  let comm1: TestUser;
  let comm2: TestUser;
  let cliente1Id: string;
  let documentoComm1Id: string;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    comm1 = await createTestUser("commerciale");
    comm2 = await createTestUser("commerciale");

    const svc = adminClient();
    const c = await svc.from("clienti").insert({
      tipo_cliente: "privato",
      nome: "Mario Rossi",
      commerciale_id: comm1.id,
    }).select("id").single();
    cliente1Id = c.data!.id;

    const d = await svc.from("documenti").insert({
      cliente_id: cliente1Id,
      tipo: "carta_identita",
      file_path: `${cliente1Id}/documenti/test/test.pdf`,
      data_scadenza: "2027-01-01",
    }).select("id").single();
    documentoComm1Id = d.data!.id;
  });

  afterAll(async () => {
    for (const u of [admin, comm1, comm2]) await deleteTestUser(u.id);
  });

  it("comm1 sees documenti of own cliente", async () => {
    const { data } = await comm1.client.from("documenti").select("id");
    expect((data ?? []).map((r) => r.id)).toContain(documentoComm1Id);
  });

  it("comm2 does NOT see documenti of comm1's cliente", async () => {
    const { data } = await comm2.client.from("documenti").select("id");
    expect((data ?? []).map((r) => r.id)).not.toContain(documentoComm1Id);
  });

  it("admin sees all documenti", async () => {
    const { data } = await admin.client.from("documenti").select("id");
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(1);
  });
});
