import {
  type ApiModel,
  DEFAULT_VARIABLES,
  type EmittedFile,
  type EnvironmentDefinition,
  type Finding,
  type OpenChasquiConfig,
  PLUGIN_API_VERSION,
  type Plugin,
  type PluginContext,
  type SourceReader,
} from "@abitechdev/openchasqui-spec";
import { assertConfig } from "./config.js";
import { parseDocument } from "./document.js";
import { OpenChasquiError } from "./errors.js";

const DEFAULT_RESPONSE_TIME_MS = 5000;

export interface RunOptions {
  readonly reader: SourceReader;
  readonly plugins: readonly Plugin[];
}

export interface TargetOutput {
  readonly target: string;
  readonly files: readonly EmittedFile[];
}

export interface RunResult {
  readonly model: ApiModel;
  readonly findings: readonly Finding[];
  readonly outputs: readonly TargetOutput[];
}

export async function run(config: OpenChasquiConfig, options: RunOptions): Promise<RunResult> {
  assertConfig(config);
  for (const plugin of options.plugins) {
    assertCompatible(plugin);
  }
  const context: PluginContext = {
    reader: options.reader,
    options: {
      overlays: config.overlays ?? [],
      data: config.data ?? "generic",
      responseTimeMs: config.tests?.responseTimeMs ?? DEFAULT_RESPONSE_TIME_MS,
    },
  };
  const findings: Finding[] = [];
  let document = parseDocument(await options.reader.readText(config.source));
  for (const plugin of options.plugins) {
    if (plugin.kind === "document-transformer") {
      const result = await plugin.transformDocument(document, context);
      document = result.document;
      findings.push(...result.findings);
    }
  }
  const loader = options.plugins.find(
    (plugin) => plugin.kind === "loader" && plugin.canLoad(document),
  );
  if (loader?.kind !== "loader") {
    throw new OpenChasquiError(
      "unsupported-document",
      `No loader understands ${config.source}. Is it an OpenAPI 3.0 or 3.1 document?`,
    );
  }

  let model = await loader.load(document, context);
  for (const plugin of options.plugins) {
    if (plugin.kind === "transformer") {
      model = await plugin.transform(model, context);
    }
  }
  for (const plugin of options.plugins) {
    if (plugin.kind === "generator") {
      model = await plugin.generate(model, context);
    }
  }

  for (const plugin of options.plugins) {
    if (plugin.kind === "validator") {
      findings.push(...(await plugin.validate(model, context)));
    }
  }

  const environments = toEnvironments(config);
  const variables = { ...DEFAULT_VARIABLES, ...config.variables };
  const outputs: TargetOutput[] = [];
  for (const target of config.targets) {
    const emitter = options.plugins.find(
      (plugin) => plugin.kind === "emitter" && plugin.target === target,
    );
    if (emitter?.kind !== "emitter") {
      throw new OpenChasquiError(
        "unknown-target",
        `No emitter is installed for target "${target}".`,
      );
    }
    const files = await emitter.emit({ model, environments, variables }, context);
    outputs.push({ target, files: sortedSafe(files, target) });
  }
  return { model, findings, outputs };
}

function assertCompatible(plugin: Plugin): void {
  if (plugin.apiVersion !== PLUGIN_API_VERSION) {
    throw new OpenChasquiError(
      "incompatible-plugin",
      `Plugin "${plugin.name}" uses plugin API ${plugin.apiVersion}; this core supports ${PLUGIN_API_VERSION}.`,
    );
  }
}

function toEnvironments(config: OpenChasquiConfig): EnvironmentDefinition[] {
  return Object.entries(config.environments ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, environment]) => ({
      name,
      variables: environment.variables,
      secrets: environment.secrets ?? [],
    }));
}

/** Sorts files for stable output and keeps them inside the target folder. */
function sortedSafe(files: readonly EmittedFile[], target: string): EmittedFile[] {
  for (const file of files) {
    const parts = file.path.split("/");
    if (file.path.startsWith("/") || /^[a-zA-Z]:/.test(file.path) || parts.includes("..")) {
      throw new OpenChasquiError(
        "unsafe-output-path",
        `Emitter "${target}" tried to write outside its folder: ${file.path}`,
      );
    }
  }
  return [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
