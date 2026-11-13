import { readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { parseDocument } from "./core/index.js";
import type { Console } from "./project.js";

const CANDIDATES = [
  "openapi.yaml",
  "openapi.yml",
  "openapi.json",
  "docs/openapi.yaml",
  "docs/openapi.json",
];

/** Writes a starting configuration next to the contract it finds. */
export async function init(configPath: string, output: Console): Promise<number> {
  if (await exists(configPath)) {
    output.error(`${basename(configPath)} already exists; edit it instead.`);
    return 1;
  }
  const base = dirname(configPath);
  let source = "openapi.yaml";
  for (const candidate of CANDIDATES) {
    if (await exists(join(base, candidate))) {
      source = candidate;
      break;
    }
  }
  const baseUrl = await firstServer(join(base, source));
  await writeFile(configPath, template(source, baseUrl), "utf8");
  output.log(`Created ${basename(configPath)} for ${source}. Run "openchasqui generate".`);
  return 0;
}

async function firstServer(path: string): Promise<string> {
  const text = await readFile(path, "utf8").catch(() => "");
  const document = text ? (parseDocument(text) as { servers?: { url?: unknown }[] }) : {};
  const url = document.servers?.[0]?.url;
  return typeof url === "string" && url ? url : "http://localhost:3000";
}

function template(source: string, baseUrl: string): string {
  return `version: 1
source: ${source}
targets: [postman, bruno]
output: collections
environments:
  dev:
    variables:
      baseUrl: ${baseUrl}
    secrets: [token]
`;
}

async function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}
