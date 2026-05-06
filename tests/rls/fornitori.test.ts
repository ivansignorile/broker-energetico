import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: fornitori", () => {
  let admin: TestUser;
  let comm: TestUser;
  let fornitoreId: string;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    comm = await createTestUser("commerciale");

    const svc = adminClient();
    const ins = await svc.from("fornitori").insert({ nome: "Enel Energia" }).select("id").single();
    fornitoreId = ins.data!.id;
  });

  afterAll(async () => {
    for (const u of [admin, comm]) await deleteTestUser(u.id);
  });

  it("all roles can SELECT fornitori", async () => {
    const { data } = await comm.client.from("fornitori").select("id");
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("commerciale cannot INSERT fornitori", async () => {
    const { error } = await comm.client.from("fornitori").insert({ nome: "Hacker Energia" });
    expect(error).not.toBeNull();
  });

  it("admin can INSERT fornitori", async () => {
    const { error } = await admin.client.from("fornitori").insert({ nome: "Edison" });
    expect(error).toBeNull();
  });

  it("commerciale cannot UPDATE fornitori", async () => {
    const newName = `Hacked ${Date.now()}`;
    await comm.client.from("fornitori").update({ nome: newName }).eq("id", fornitoreId);
    const reread = await admin.client.from("fornitori").select("nome").eq("id", fornitoreId).single();
    expect(reread.data?.nome).not.toBe(newName);
  });
});
