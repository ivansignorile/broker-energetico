// tests/setup.ts
import { config } from "dotenv";

// In CI uses .env.test; in local dev uses .env.local
config({ path: ".env.test" });
config({ path: ".env.local", override: false });
