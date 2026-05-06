import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: profiles", () => {
  let admin: TestUser;
  let commerciale: TestUser;
  let operatore: TestUser;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    commerciale = await createTestUser("commerciale");
    operatore = await createTestUser("operatore");
  });

  afterAll(async () => {
    await deleteTestUser(admin.id);
    await deleteTestUser(commerciale.id);
    await deleteTestUser(operatore.id);
  });

  it("authenticated users can SELECT all profiles", async () => {
    const { data, error } = await commerciale.client.from("profiles").select("id, ruolo");
    expect(error).toBeNull();
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it("non-admin cannot UPDATE another profile", async () => {
    await commerciale.client.from("profiles").update({ nome_completo: "hacked" }).eq("id", admin.id);
    const reread = await admin.client.from("profiles").select("nome_completo").eq("id", admin.id).single();
    expect(reread.data?.nome_completo).not.toBe("hacked");
  });

  it("admin can UPDATE another profile", async () => {
    const newName = `Admin updated ${Date.now()}`;
    const { error } = await admin.client.from("profiles").update({ nome_completo: newName }).eq("id", commerciale.id);
    expect(error).toBeNull();
    const reread = await admin.client.from("profiles").select("nome_completo").eq("id", commerciale.id).single();
    expect(reread.data?.nome_completo).toBe(newName);
  });
});
