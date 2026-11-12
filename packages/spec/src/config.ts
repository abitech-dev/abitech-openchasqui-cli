/** Configuration file version. `openchasqui migrate` moves it forward. */
export const CONFIG_VERSION = 1 as const;

export interface OpenChasquiConfig {
  readonly version: typeof CONFIG_VERSION;
  /** Path to the OpenAPI document, relative to the configuration file. */
  readonly source: string;
  /** Overlay 1.0 documents, applied in order. */
  readonly overlays?: readonly string[];
  readonly environments?: Readonly<Record<string, EnvironmentConfig>>;
  readonly variables?: VariableNames;
  readonly targets: readonly string[];
  /** Folder for the emitted collections, one subfolder per target. */
  readonly output: string;
}

/** Names of the variables the collections use. */
export interface VariableNames {
  /** Defaults to `baseUrl`. */
  readonly baseUrl?: string;
  /** Defaults to `token`. */
  readonly token?: string;
  /** Defaults to `apiKey`. */
  readonly apiKey?: string;
}

export const DEFAULT_VARIABLES: Required<VariableNames> = {
  baseUrl: "baseUrl",
  token: "token",
  apiKey: "apiKey",
};

export interface EnvironmentConfig {
  readonly variables: Readonly<Record<string, string>>;
  /** Variable names whose values never leave the user's machine. */
  readonly secrets?: readonly string[];
}
