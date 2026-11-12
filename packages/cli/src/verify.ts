import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { type Console, MARKER, report, runProject } from "./project.js";

/**
 * Checks without writing that the policies pass and that the collections on
 * disk match what the contract produces today. Built for CI.
 */
export async function verify(configPath: string, output: Console): Promise<number> {
  const { outputRoot, result } = await runProject(configPath);
  let failed = report(result.findings, output);

  for (const { target, files } of result.outputs) {
    const folder = join(outputRoot, target);
    const onDisk = await readTree(folder);
    const expected = new Map(files.map((file) => [file.path, file.contents]));
    const problems: string[] = [];
    for (const [path, contents] of expected) {
      if (!onDisk.has(path)) problems.push(`missing ${path}`);
      else if (onDisk.get(path) !== contents) problems.push(`outdated ${path}`);
    }
    for (const path of onDisk.keys()) {
      if (!expected.has(path)) problems.push(`unexpected ${path}`);
    }
    if (problems.length > 0) {
      failed = true;
      output.error(
        `${target}: ${relative(process.cwd(), folder)} is out of date. Run "openchasqui generate".`,
      );
      for (const problem of problems.sort()) output.error(`  ${problem}`);
    } else {
      output.log(`${target}: up to date`);
    }
  }
  return failed ? 1 : 0;
}

async function readTree(folder: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const entries = await readdir(folder, { recursive: true, withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isFile() || entry.name === MARKER) {
      continue;
    }
    const path = join(entry.parentPath, entry.name);
    files.set(relative(folder, path).split("\\").join("/"), await readFile(path, "utf8"));
  }
  return files;
}
