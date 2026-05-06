import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: clienti", () => {
  let admin: TestUser;
  let comm1: TestUser;
  let comm2: TestUser;
  let operatore: TestUser;
  let clienteCommerciale1Id: string;
  let clienteOrfanoId: string;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    comm1 = await createTestUser("commerciale");
    comm2 = await createTestUser("commerciale");
    operatore = await createTestUser("operatore");

    const svc = adminClient();
    const inserted1 = await svc.from("clienti").insert({
      tipo_cliente: "privato",
      nome: "Cliente di Comm1",
      commerciale_id: comm1.id,
    }).select("id").single();
    clienteCommerciale1Id = inserted1.data!.id;

    const insertedOrfano = await svc.from("clienti").insert({
      tipo_cliente: "privato",
      nome: "Cliente orfano",
      commerciale_id: null,
    }).select("id").single();
    clienteOrfanoId = insertedOrfano.data!.id;
  });

  afterAll(async () => {
    for (const u of [admin, comm1, comm2, operatore]) await deleteTestUser(u.id);
  });

  it("admin sees all clienti", async () => {
    const { data } = await admin.client.from("clienti").select("id");
    expect(data?.length ?? 0).toBe(2);
  });

  it("operatore sees all clienti", async () => {
    const { data } = await operatore.client.from("clienti").select("id");
    expect(data?.length ?? 0).toBe(2);
  });

  it("commerciale sees own + orphan clienti", async () => {
    const { data } = await comm1.client.from("clienti").select("id");
    const ids = (data ?? []).map((c) => c.id);
    expect(ids).toContain(clienteCommerciale1Id);
    expect(ids).toContain(clienteOrfanoId);
    expect(ids.length).toBe(2);
  });

  it("commerciale does NOT see other commerciale's clienti", async () => {
    const { data } = await comm2.client.from("clienti").select("id");
    const ids = (data ?? []).map((c) => c.id);
    expect(ids).not.toContain(clienteCommerciale1Id);
    expect(ids).toContain(clienteOrfanoId);
  });

  it("commerciale cannot DELETE clienti", async () => {
    await comm1.client.from("clienti").delete().eq("id", clienteCommerciale1Id);
    const reread = await admin.client.from("clienti").select("id").eq("id", clienteCommerciale1Id).maybeSingle();
    expect(reread.data?.id).toBe(clienteCommerciale1Id);
  });

  it("admin can DELETE clienti", async () => {
    const svc = adminClient();
    const { data: created } = await svc.from("clienti").insert({
      tipo_cliente: "privato",
      nome: "ToDelete",
    }).select("id").single();
    const { error } = await admin.client.from("clienti").delete().eq("id", created!.id);
    expect(error).toBeNull();
  });
});
