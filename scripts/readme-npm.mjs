// Copies the repository README into the CLI package for its npm page.
// npm cannot resolve repository-relative links, so they become absolute.
import { readFileSync, writeFileSync } from "node:fs";

const REPO = "https://github.com/abitech-dev/abitech-openchasqui-cli";
const RAW = "https://raw.githubusercontent.com/abitech-dev/abitech-openchasqui-cli/main";
const root = new URL("../", import.meta.url);

function absolute(target) {
  if (/^(https?:|mailto:|#)/.test(target)) return target;
  if (target.startsWith(".github/assets/")) return `${RAW}/${target}`;
  if (target.startsWith("packages/")) return `${REPO}/tree/main/${target}`;
  return `${REPO}/blob/main/${target}`;
}

const readme = readFileSync(new URL("README.md", root), "utf8")
  .replace(
    /(src|srcset|href)="([^"]+)"/g,
    (_, attribute, target) => `${attribute}="${absolute(target)}"`,
  )
  .replace(/\]\(([^)\s]+)\)/g, (_, target) => `](${absolute(target)})`);

writeFileSync(new URL("packages/cli/README.md", root), readme);
