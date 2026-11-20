import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const source = path.join(process.cwd(), "node_modules/monaco-editor/min/vs");
const destination = path.join(process.cwd(), "public/monaco/vs");

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(source))) {
    console.warn("[copy-monaco] monaco-editor is not installed yet; skipping.");
    return;
  }
  await rm(path.dirname(destination), { recursive: true, force: true });
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
}

main().catch((error) => {
  console.error("[copy-monaco] failed", error);
  process.exit(1);
});
