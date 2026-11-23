import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const source = path.join(process.cwd(), "node_modules/sql.js/dist/sql-wasm.wasm");
const destination = path.join(process.cwd(), "public/sqljs/sql-wasm.wasm");

async function main() {
  try {
    await stat(source);
  } catch {
    console.warn("[copy-sqljs] sql.js is not installed yet; skipping.");
    return;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
  console.log("[copy-sqljs] copied sql-wasm.wasm");
}

main().catch((error) => {
  console.error("[copy-sqljs] failed", error);
  process.exit(1);
});
