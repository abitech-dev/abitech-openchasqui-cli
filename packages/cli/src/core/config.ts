import { CONFIG_VERSION, type OpenChasquiConfig } from "@abitechdev/openchasqui-plugin-kit";
import { OpenChasquiError } from "./errors.js";

const PRODUCTION_NAMES = /^(prd|prod|production|produccion|producción)$/i;

/** Rejects a configuration that cannot run or that would leak secrets. */
export function assertConfig(config: OpenChasquiConfig): void {
  const problems: string[] = [];
  if (config.version !== CONFIG_VERSION) {
    problems.push(`version must be ${CONFIG_VERSION}`);
  }
  if (!config.source) {
    problems.push("source is required");
  }
  if (!config.output) {
    problems.push("output is required");
  }
  if (!config.targets?.length) {
    problems.push("targets needs at least one target");
  }
  for (const [name, environment] of Object.entries(config.environments ?? {})) {
    if (PRODUCTION_NAMES.test(name)) {
      problems.push(`environment "${name}" looks like production; collections never ship one`);
    }
    for (const secret of environment.secrets ?? []) {
      if (environment.variables[secret]) {
        problems.push(`environment "${name}" gives a value to secret "${secret}"`);
      }
    }
  }
  if (problems.length > 0) {
    throw new OpenChasquiError("invalid-config", `Invalid configuration: ${problems.join("; ")}.`);
  }
}
