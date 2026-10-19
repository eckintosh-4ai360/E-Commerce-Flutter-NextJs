import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

try {
  process.loadEnvFile();
} catch (error) {
  if (error?.code !== "ENOENT") {
    throw error;
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error("DATABASE_URL is required to synchronize the Prisma schema.");
  process.exit(1);
}

if (!process.env.DIRECT_URL?.trim()) {
  process.env.DIRECT_URL = databaseUrl;
  console.log("DIRECT_URL is not set; using DATABASE_URL for schema synchronization.");
}

const require = createRequire(import.meta.url);
const prismaCli = require.resolve("prisma/build/index.js");
const result = spawnSync(
  process.execPath,
  [prismaCli, "db", "push", "--skip-generate"],
  {
    env: process.env,
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
