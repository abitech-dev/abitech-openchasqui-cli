import {
  type ApiModel,
  type HttpMethod,
  type JsonSchema,
  type Loader,
  type MediaContent,
  MODEL_VERSION,
  type Operation,
  type Parameter,
  type ParameterLocation,
  type RequestBody,
  type Response,
  type SecurityScheme,
} from "@abitechdev/openchasqui-spec";

type Json = Record<string, unknown>;

const METHODS: readonly HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const LOCATIONS: readonly ParameterLocation[] = ["path", "query", "header", "cookie"];

export const openApiLoader: Loader = {
  name: "@abitechdev/openchasqui-loader-openapi",
  kind: "loader",
  apiVersion: 1,
  canLoad: (document) => /^3\.[01]\.\d+$/.test(String(asJson(document).openapi ?? "")),
  load: async (document) => toModel(asJson(document)),
};

function toModel(document: Json): ApiModel {
  const components = asJson(document.components);
  const resolve = (value: unknown): Json => resolveRef(value, document);
  const info = asJson(document.info);
  const operations: Operation[] = [];

  for (const [path, rawPathItem] of Object.entries(asJson(document.paths))) {
    const pathItem = resolve(rawPathItem);
    const shared = asArray(pathItem.parameters).map((p) => toParameter(resolve(p)));
    for (const method of METHODS) {
      const raw = pathItem[method.toLowerCase()];
      if (raw === undefined) {
        continue;
      }
      operations.push(toOperation(method, path, resolve(raw), shared, document, resolve));
    }
  }

  return {
    modelVersion: MODEL_VERSION,
    info: {
      title: String(info.title ?? "API"),
      version: String(info.version ?? "0.0.0"),
      ...optional("description", info.description),
    },
    servers: asArray(document.servers).map((server) => {
      const s = asJson(server);
      return { url: String(s.url ?? ""), ...optional("description", s.description) };
    }),
    securitySchemes: toSecuritySchemes(asJson(components.securitySchemes), resolve),
    operations: withFoldersAndOrder(operations),
    schemas: asJson(components.schemas) as Record<string, JsonSchema>,
  };
}

function toOperation(
  method: HttpMethod,
  path: string,
  operation: Json,
  shared: readonly Parameter[],
  document: Json,
  resolve: (value: unknown) => Json,
): Operation {
  const own = asArray(operation.parameters).map((p) => toParameter(resolve(p)));
  const parameters = mergeParameters(shared, own);
  const requestBody =
    operation.requestBody === undefined ? undefined : resolve(operation.requestBody);
  const tags = asArray(operation.tags).map(String);
  const operationId = typeof operation.operationId === "string" ? operation.operationId : undefined;

  return {
    id: operationId ?? `${method} ${path}`,
    method,
    path,
    name: displayName(operation, operationId, method, path),
    folder: folderOf(operation, tags, path),
    order: 0,
    ...optional("summary", operation.summary),
    ...optional("description", operation.description),
    deprecated: operation.deprecated === true,
    parameters,
    ...(requestBody ? { requestBody: toRequestBody(requestBody) } : {}),
    responses: toResponses(asJson(operation.responses), resolve),
    security: securityNames(operation.security ?? document.security),
    tests: [],
    extensions: extensionsOf(operation),
  };
}

function toParameter(raw: Json): Parameter {
  const location = LOCATIONS.includes(raw.in as ParameterLocation)
    ? (raw.in as ParameterLocation)
    : "query";
  return {
    name: String(raw.name ?? ""),
    in: location,
    required: location === "path" || raw.required === true,
    ...optional("description", raw.description),
    ...(raw.schema === undefined ? {} : { schema: raw.schema as JsonSchema }),
    ...(raw.example === undefined ? {} : { example: raw.example }),
  };
}

/** An operation parameter replaces the path parameter it repeats. */
function mergeParameters(shared: readonly Parameter[], own: readonly Parameter[]): Parameter[] {
  const key = (p: Parameter) => `${p.in}:${p.name}`;
  const ownKeys = new Set(own.map(key));
  return [...shared.filter((p) => !ownKeys.has(key(p))), ...own];
}

function toRequestBody(raw: Json): RequestBody {
  return { required: raw.required === true, content: toContent(asJson(raw.content)) };
}

function toResponses(raw: Json, resolve: (value: unknown) => Json): Response[] {
  return Object.entries(raw)
    .filter(([status]) => !status.startsWith("x-"))
    .map(([status, value]) => {
      const response = resolve(value);
      return {
        status,
        ...optional("description", response.description),
        content: toContent(asJson(response.content)),
      };
    });
}

function toContent(raw: Json): MediaContent[] {
  return Object.entries(raw).map(([mediaType, value]) => {
    const media = asJson(value);
    const examples = Object.values(asJson(media.examples));
    const example = media.example ?? asJson(examples[0]).value;
    return {
      mediaType,
      ...(media.schema === undefined ? {} : { schema: media.schema as JsonSchema }),
      ...(example === undefined ? {} : { example }),
    };
  });
}

function toSecuritySchemes(
  raw: Json,
  resolve: (value: unknown) => Json,
): Record<string, SecurityScheme> {
  const schemes: Record<string, SecurityScheme> = {};
  for (const [name, value] of Object.entries(raw)) {
    const scheme = resolve(value);
    const type = scheme.type;
    if (type === "http" && (scheme.scheme === "bearer" || scheme.scheme === "basic")) {
      schemes[name] = {
        type: "http",
        scheme: scheme.scheme,
        ...optional("bearerFormat", scheme.bearerFormat),
      };
    } else if (type === "apiKey") {
      const location = scheme.in === "query" || scheme.in === "cookie" ? scheme.in : "header";
      schemes[name] = { type: "apiKey", in: location, name: String(scheme.name ?? "") };
    } else if (type === "oauth2" || type === "openIdConnect") {
      schemes[name] = { type };
    }
  }
  return schemes;
}

/** An empty requirement (`{}`) makes the call public. */
function securityNames(requirements: unknown): string[] {
  const list = asArray(requirements).map(asJson);
  if (list.length === 0 || list.some((requirement) => Object.keys(requirement).length === 0)) {
    return [];
  }
  return [...new Set(list.flatMap((requirement) => Object.keys(requirement)))].sort();
}

function displayName(
  operation: Json,
  operationId: string | undefined,
  method: HttpMethod,
  path: string,
) {
  if (typeof operation.summary === "string" && operation.summary.trim()) {
    return operation.summary.trim();
  }
  return operationId ?? `${method} ${path}`;
}

/** `x-openchasqui-folder` first, then the first tag, then the path. */
function folderOf(operation: Json, tags: readonly string[], path: string): string[] {
  const custom = operation["x-openchasqui-folder"];
  if (typeof custom === "string" && custom.trim()) {
    return custom
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [tags[0] ?? firstSegment(path)];
}

function firstSegment(path: string): string {
  return path.split("/").find((segment) => segment && !segment.startsWith("{")) ?? "root";
}

/** Orders by `x-openchasqui-order`, then path and method, from 1. */
function withFoldersAndOrder(operations: Operation[]): Operation[] {
  const sorted = [...operations].sort(
    (a, b) =>
      a.folder.join("/").localeCompare(b.folder.join("/")) ||
      explicitOrder(a) - explicitOrder(b) ||
      a.path.localeCompare(b.path) ||
      METHODS.indexOf(a.method) - METHODS.indexOf(b.method),
  );
  const counters = new Map<string, number>();
  return sorted.map((operation) => {
    const folder = operation.folder.join("/");
    const order = (counters.get(folder) ?? 0) + 1;
    counters.set(folder, order);
    return { ...operation, order };
  });
}

function explicitOrder(operation: Operation): number {
  const order = operation.extensions["x-openchasqui-order"];
  return typeof order === "number" ? order : Number.MAX_SAFE_INTEGER;
}

function extensionsOf(value: Json): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key.startsWith("x-")));
}

/** Resolves a local `$ref` such as `#/components/parameters/Page`. */
function resolveRef(value: unknown, document: Json, depth = 0): Json {
  const json = asJson(value);
  const ref = json.$ref;
  if (typeof ref !== "string" || depth > 20) {
    return json;
  }
  if (!ref.startsWith("#/")) {
    throw new Error(`External reference not supported yet: ${ref}`);
  }
  const target = ref
    .slice(2)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>((node, part) => asJson(node)[part], document);
  return resolveRef(target, document, depth + 1);
}

function asJson(value: unknown): Json {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function optional<K extends string>(key: K, value: unknown): { [P in K]?: string } {
  return typeof value === "string" && value ? ({ [key]: value } as { [P in K]: string }) : {};
}
