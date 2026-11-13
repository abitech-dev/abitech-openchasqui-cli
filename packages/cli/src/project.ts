import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Finding, OpenChasquiConfig, Plugin } from "@abitechdev/openchasqui-plugin-kit";
import { parseDocument, type RunResult, run } from "./core/index.js";
import { brunoEmitter } from "./plugins/emitter-bruno/index.js";
import { postmanEmitter } from "./plugins/emitter-postman/index.js";
import { examplesGenerator } from "./plugins/generator-examples/index.js";
import { testsGenerator } from "./plugins/generator-tests/index.js";
import { openApiLoader } from "./plugins/loader-openapi/index.js";
import { overlayTransformer } from "./plugins/transformer-overlay/index.js";
import { policiesValidator } from "./plugins/validator-policies/index.js";

/** Marks a folder as generated, so the next run may replace it. */
export const MARKER = ".openchasqui";

export const BUILT_IN_PLUGINS: readonly Plugin[] = [
  overlayTransformer,
  openApiLoader,
  examplesGenerator,
  testsGenerator,
  policiesValidator,
  postmanEmitter,
  brunoEmitter,
];

export interface Console {
  log(message: string): void;
  error(message: string): void;
}

export interface Project {
  readonly config: OpenChasquiConfig;
  readonly outputRoot: string;
  readonly result: RunResult;
}

/** Reads the configuration and runs the pipeline without writing anything. */
export async function runProject(configPath: string): Promise<Project> {
  const base = dirname(configPath);
  const config = parseDocument(await readFile(configPath, "utf8")) as OpenChasquiConfig;
  const reader = { readText: (path: string) => readFile(resolve(base, path), "utf8") };
  const result = await run(config, { reader, plugins: BUILT_IN_PLUGINS });
  return { config, outputRoot: resolve(base, config.output), result };
}

export function report(findings: readonly Finding[], output: Console): boolean {
  for (const finding of findings) {
    const where = finding.operationId
      ? ` (${finding.operationId})`
      : finding.file
        ? ` (${finding.file})`
        : "";
    output.error(`${finding.severity} ${finding.rule}: ${finding.message}${where}`);
  }
  return findings.some((finding) => finding.severity === "error");
}
