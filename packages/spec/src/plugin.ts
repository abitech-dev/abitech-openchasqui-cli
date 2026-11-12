import type { VariableNames } from "./config.js";
import type { ApiModel } from "./model.js";

/** Plugin contract version. The core also accepts the previous one. */
export const PLUGIN_API_VERSION = 1 as const;

export type PluginKind =
  | "document-transformer"
  | "loader"
  | "transformer"
  | "generator"
  | "validator"
  | "emitter"
  | "runner"
  | "reporter";

export interface PluginBase {
  readonly name: string;
  readonly kind: PluginKind;
  readonly apiVersion: typeof PLUGIN_API_VERSION;
}

/** Reads files for a plugin. Plugins never touch the disk themselves. */
export interface SourceReader {
  readText(path: string): Promise<string>;
}

export interface PluginContext {
  readonly reader: SourceReader;
  readonly options: Readonly<Record<string, unknown>>;
}

export interface DocumentTransformResult {
  readonly document: unknown;
  readonly findings: readonly Finding[];
}

/** Changes the source document before a loader reads it, as Overlay does. */
export interface DocumentTransformer extends PluginBase {
  readonly kind: "document-transformer";
  transformDocument(document: unknown, context: PluginContext): Promise<DocumentTransformResult>;
}

export interface Loader extends PluginBase {
  readonly kind: "loader";
  canLoad(document: unknown): boolean;
  load(document: unknown, context: PluginContext): Promise<ApiModel>;
}

export interface Transformer extends PluginBase {
  readonly kind: "transformer";
  transform(model: ApiModel, context: PluginContext): Promise<ApiModel>;
}

export interface Generator extends PluginBase {
  readonly kind: "generator";
  generate(model: ApiModel, context: PluginContext): Promise<ApiModel>;
}

export type Severity = "error" | "warning" | "info";

export interface Finding {
  readonly rule: string;
  readonly severity: Severity;
  readonly message: string;
  readonly operationId?: string;
  readonly file?: string;
}

export interface Validator extends PluginBase {
  readonly kind: "validator";
  validate(model: ApiModel, context: PluginContext): Promise<readonly Finding[]>;
}

export interface EmittedFile {
  /** Relative to the target folder, with forward slashes. */
  readonly path: string;
  readonly contents: string;
}

export interface EnvironmentDefinition {
  readonly name: string;
  readonly variables: Readonly<Record<string, string>>;
  readonly secrets: readonly string[];
}

export interface EmitInput {
  readonly model: ApiModel;
  readonly environments: readonly EnvironmentDefinition[];
  readonly variables: Required<VariableNames>;
}

export interface Emitter extends PluginBase {
  readonly kind: "emitter";
  /** Name used in the configuration, e.g. `postman`. */
  readonly target: string;
  emit(input: EmitInput, context: PluginContext): Promise<readonly EmittedFile[]>;
}

export type Plugin = DocumentTransformer | Loader | Transformer | Generator | Validator | Emitter;
