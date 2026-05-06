import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: notifiche_log", () => {
  let admin: TestUser;
  let comm: TestUser;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    comm = await createTestUser("commerciale");

    const svc = adminClient();
    await svc.from("notifiche_log").insert({
      entity_type: "contratto",
      entity_id: "00000000-0000-0000-0000-000000000001",
      soglia: 60,
      recipient_email: "test@example.com",
    });
  });

  afterAll(async () => {
    for (const u of [admin, comm]) await deleteTestUser(u.id);
  });

  it("admin can SELECT notifiche_log", async () => {
    const { data } = await admin.client.from("notifiche_log").select("id");
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("commerciale cannot SELECT notifiche_log", async () => {
    const { data } = await comm.client.from("notifiche_log").select("id");
    expect(data?.length ?? 0).toBe(0);
  });

  it("nobody can INSERT notifiche_log via authenticated", async () => {
    const { error } = await admin.client.from("notifiche_log").insert({
      entity_type: "contratto",
      entity_id: "00000000-0000-0000-0000-000000000002",
      soglia: 30,
      recipient_email: "x@example.com",
    });
    expect(error).not.toBeNull();
  });
});

describe("RLS: cron_runs", () => {
  let admin: TestUser;
  let comm: TestUser;

  beforeAll(async () => {
    admin = await createTestUser("admin");
    comm = await createTestUser("commerciale");

    const svc = adminClient();
    await svc.from("cron_runs").insert({
      job_name: "test-job",
      ok: true,
      summary: { test: true },
    });
  });

  afterAll(async () => {
    for (const u of [admin, comm]) await deleteTestUser(u.id);
  });

  it("admin can SELECT cron_runs", async () => {
    const { data } = await admin.client.from("cron_runs").select("id");
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("commerciale cannot SELECT cron_runs", async () => {
    const { data } = await comm.client.from("cron_runs").select("id");
    expect(data?.length ?? 0).toBe(0);
  });

  it("nobody can INSERT cron_runs via authenticated", async () => {
    const { error } = await admin.client.from("cron_runs").insert({
      job_name: "hacker", ok: false,
    });
    expect(error).not.toBeNull();
  });
});
