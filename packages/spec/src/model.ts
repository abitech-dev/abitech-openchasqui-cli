/** Version of the canonical model. A breaking change ships with a migration. */
export const MODEL_VERSION = 1 as const;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/** JSON Schema 2020-12, as found in an OpenAPI 3.1 document. */
export type JsonSchema = { readonly [keyword: string]: unknown };

export interface ApiModel {
  readonly modelVersion: typeof MODEL_VERSION;
  readonly info: ApiInfo;
  readonly servers: readonly Server[];
  readonly securitySchemes: Readonly<Record<string, SecurityScheme>>;
  readonly operations: readonly Operation[];
  readonly schemas: Readonly<Record<string, JsonSchema>>;
}

export interface ApiInfo {
  readonly title: string;
  readonly version: string;
  readonly description?: string;
}

export interface Server {
  readonly url: string;
  readonly description?: string;
}

export type SecurityScheme =
  | { readonly type: "http"; readonly scheme: "bearer" | "basic"; readonly bearerFormat?: string }
  | { readonly type: "apiKey"; readonly in: "header" | "query" | "cookie"; readonly name: string }
  | { readonly type: "oauth2" | "openIdConnect" };

export interface Operation {
  /** The operationId, or the method plus the path when it is missing. */
  readonly id: string;
  readonly method: HttpMethod;
  /** Path template with OpenAPI braces, e.g. `/banks/{id}`. */
  readonly path: string;
  /** Display name in the collection. */
  readonly name: string;
  /** Folder path from the root of the collection. */
  readonly folder: readonly string[];
  /** Position inside its folder, starting at 1. */
  readonly order: number;
  readonly summary?: string;
  readonly description?: string;
  readonly deprecated: boolean;
  readonly parameters: readonly Parameter[];
  readonly requestBody?: RequestBody;
  readonly responses: readonly Response[];
  /** Names of the security schemes that apply. Empty means public. */
  readonly security: readonly string[];
  readonly tests: readonly TestCase[];
  /** `x-` extensions of the source operation, untouched. */
  readonly extensions: Readonly<Record<string, unknown>>;
}

export type ParameterLocation = "path" | "query" | "header" | "cookie";

export interface Parameter {
  readonly name: string;
  readonly in: ParameterLocation;
  readonly required: boolean;
  readonly description?: string;
  readonly schema?: JsonSchema;
  readonly example?: unknown;
}

export interface RequestBody {
  readonly required: boolean;
  readonly content: readonly MediaContent[];
}

export interface MediaContent {
  readonly mediaType: string;
  readonly schema?: JsonSchema;
  readonly example?: unknown;
}

export interface Response {
  /** Status code (`200`), range (`2XX`) or `default`, as in OpenAPI. */
  readonly status: string;
  readonly description?: string;
  readonly content: readonly MediaContent[];
}

export type TestCase =
  | { readonly kind: "status"; readonly expected: readonly number[] }
  | { readonly kind: "contentType"; readonly mediaType: string }
  | { readonly kind: "jsonSchema"; readonly schema: JsonSchema }
  | { readonly kind: "responseTime"; readonly maxMilliseconds: number };
