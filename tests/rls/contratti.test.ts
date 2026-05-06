import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: contratti", () => {
  let admin: TestUser;
  let comm1: TestUser;
  let comm2: TestUser;
  let cliente1Id: string;
  let fornitoreId: string;
  let contrattoComm1Id: string;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    comm1 = await createTestUser("commerciale");
    comm2 = await createTestUser("commerciale");

    const svc = adminClient();
    const f = await svc.from("fornitori").insert({ nome: "Enel" }).select("id").single();
    fornitoreId = f.data!.id;

    const c = await svc.from("clienti").insert({
      tipo_cliente: "azienda",
      nome: "Acme SRL",
      commerciale_id: comm1.id,
    }).select("id").single();
    cliente1Id = c.data!.id;

    const co = await svc.from("contratti").insert({
      cliente_id: cliente1Id,
      fornitore_id: fornitoreId,
      categoria: "energia",
      tipo: "luce",
      data_inizio: "2026-01-01",
      data_scadenza: "2027-01-01",
      stato: "attivo",
    }).select("id").single();
    contrattoComm1Id = co.data!.id;
  });

  afterAll(async () => {
    for (const u of [admin, comm1, comm2]) await deleteTestUser(u.id);
  });

  it("comm1 sees contratti of own cliente", async () => {
    const { data } = await comm1.client.from("contratti").select("id");
    expect((data ?? []).map((r) => r.id)).toContain(contrattoComm1Id);
  });

  it("comm2 does NOT see contratti of comm1's cliente", async () => {
    const { data } = await comm2.client.from("contratti").select("id");
    expect((data ?? []).map((r) => r.id)).not.toContain(contrattoComm1Id);
  });

  it("admin sees all contratti", async () => {
    const { data } = await admin.client.from("contratti").select("id");
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("comm1 can UPDATE contratti of own cliente", async () => {
    const { error } = await comm1.client.from("contratti").update({ note: "aggiornato" }).eq("id", contrattoComm1Id);
    expect(error).toBeNull();
  });

  it("comm2 cannot UPDATE contratti of comm1's cliente", async () => {
    await comm2.client.from("contratti").update({ note: "hacked" }).eq("id", contrattoComm1Id);
    const reread = await admin.client.from("contratti").select("note").eq("id", contrattoComm1Id).single();
    expect(reread.data?.note).not.toBe("hacked");
  });

  it("comm1 cannot DELETE contratti", async () => {
    await comm1.client.from("contratti").delete().eq("id", contrattoComm1Id);
    const reread = await admin.client.from("contratti").select("id").eq("id", contrattoComm1Id).maybeSingle();
    expect(reread.data?.id).toBe(contrattoComm1Id);
  });
});
