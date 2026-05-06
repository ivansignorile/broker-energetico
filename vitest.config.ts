// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // RLS tests share the remote Supabase DB. Run sequentially to avoid conflicts.
    pool: "forks",
    fileParallelism: false,
  },
});
