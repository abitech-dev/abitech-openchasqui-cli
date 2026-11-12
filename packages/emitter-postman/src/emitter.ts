import type {
  ApiModel,
  EmitInput,
  EmittedFile,
  Emitter,
  EnvironmentDefinition,
  JsonSchema,
  Operation,
  Parameter,
  SecurityScheme,
  TestCase,
  VariableNames,
} from "@abitech/openchasqui-spec";

const SCHEMA_URL = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json";

type Json = Record<string, unknown>;
type Variables = Required<VariableNames>;

export const postmanEmitter: Emitter = {
  name: "@abitech/openchasqui-emitter-postman",
  kind: "emitter",
  apiVersion: 1,
  target: "postman",
  emit: async (input) => emit(input),
};

function emit({ model, environments, variables }: EmitInput): EmittedFile[] {
  const slug = slugify(model.info.title);
  const files: EmittedFile[] = [
    { path: `${slug}.postman_collection.json`, contents: toJson(collection(model, variables)) },
  ];
  for (const environment of environments) {
    files.push({
      path: `${slug}-${slugify(environment.name)}.postman_environment.json`,
      contents: toJson(toEnvironment(model, environment)),
    });
  }
  return files;
}

function collection(model: ApiModel, variables: Variables): Json {
  const defaultScheme = mostUsedScheme(model);
  return {
    info: {
      name: model.info.title,
      ...(model.info.description ? { description: model.info.description } : {}),
      schema: SCHEMA_URL,
    },
    ...(defaultScheme ? { auth: auth(model.securitySchemes[defaultScheme], variables) } : {}),
    item: folders(model, defaultScheme, variables),
    variable: [{ key: variables.baseUrl, value: model.servers[0]?.url ?? "" }],
  };
}

function folders(model: ApiModel, defaultScheme: string | undefined, variables: Variables): Json[] {
  const root: Json[] = [];
  const index = new Map<string, Json[]>();
  const ordered = [...model.operations].sort(
    (a, b) => a.folder.join("/").localeCompare(b.folder.join("/")) || a.order - b.order,
  );
  for (const operation of ordered) {
    let items = root;
    for (let depth = 1; depth <= operation.folder.length; depth++) {
      const key = operation.folder.slice(0, depth).join("/");
      let children = index.get(key);
      if (!children) {
        children = [];
        index.set(key, children);
        items.push({ name: operation.folder[depth - 1], item: children });
      }
      items = children;
    }
    items.push(request(model, operation, defaultScheme, variables));
  }
  return root;
}

function request(
  model: ApiModel,
  operation: Operation,
  defaultScheme: string | undefined,
  variables: Variables,
): Json {
  const query = operation.parameters.filter((p) => p.in === "query");
  const enabled = query.filter((p) => p.required);
  const raw =
    `{{${variables.baseUrl}}}${toPostmanPath(operation.path)}` +
    (enabled.length ? `?${enabled.map((p) => `${p.name}=${exampleOf(model, p)}`).join("&")}` : "");
  const body = requestBody(model, operation);
  const headers = operation.parameters
    .filter((p) => p.in === "header")
    .map((p) => ({ key: p.name, value: exampleOf(model, p), disabled: !p.required }));
  if (body?.mode === "raw") {
    headers.push({ key: "Content-Type", value: "application/json", disabled: false });
  }

  const description = [operation.deprecated ? "Deprecated." : "", operation.description ?? ""]
    .filter(Boolean)
    .join("\n\n");
  const tests = operation.tests.flatMap((test) => script(test));
  return {
    name: operation.name,
    request: {
      method: operation.method,
      header: headers,
      url: {
        raw,
        host: [`{{${variables.baseUrl}}}`],
        path: toPostmanPath(operation.path).split("/").filter(Boolean),
        ...(query.length
          ? {
              query: query.map((p) => ({
                key: p.name,
                value: exampleOf(model, p),
                disabled: !p.required,
              })),
            }
          : {}),
        ...(operation.parameters.some((p) => p.in === "path")
          ? {
              variable: operation.parameters
                .filter((p) => p.in === "path")
                .map((p) => ({ key: p.name, value: exampleOf(model, p) })),
            }
          : {}),
      },
      ...(body ? { body } : {}),
      ...itemAuth(model, operation, defaultScheme, variables),
      ...(description ? { description } : {}),
    },
    ...(tests.length
      ? { event: [{ listen: "test", script: { type: "text/javascript", exec: tests } }] }
      : {}),
  };
}

function itemAuth(
  model: ApiModel,
  operation: Operation,
  defaultScheme: string | undefined,
  variables: Variables,
): Json {
  if (operation.security.length === 0) {
    return defaultScheme ? { auth: { type: "noauth" } } : {};
  }
  if (defaultScheme && operation.security.includes(defaultScheme)) {
    return {};
  }
  const own = operation.security[0];
  return own ? { auth: auth(model.securitySchemes[own], variables) } : {};
}

function auth(scheme: SecurityScheme | undefined, variables: Variables): Json {
  if (scheme?.type === "http" && scheme.scheme === "bearer") {
    return {
      type: "bearer",
      bearer: [{ key: "token", value: `{{${variables.token}}}`, type: "string" }],
    };
  }
  if (scheme?.type === "apiKey") {
    return {
      type: "apikey",
      apikey: [
        { key: "key", value: scheme.name, type: "string" },
        { key: "value", value: `{{${variables.apiKey}}}`, type: "string" },
        { key: "in", value: scheme.in === "query" ? "query" : "header", type: "string" },
      ],
    };
  }
  return { type: "noauth" };
}

/** The scheme most operations use becomes the collection default. */
function mostUsedScheme(model: ApiModel): string | undefined {
  const counts = new Map<string, number>();
  for (const operation of model.operations) {
    for (const name of operation.security) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
}

function requestBody(model: ApiModel, operation: Operation): Json | undefined {
  const content = operation.requestBody?.content ?? [];
  const json = content.find((c) => c.mediaType.includes("json"));
  if (json) {
    return {
      mode: "raw",
      raw: JSON.stringify(json.example ?? {}, null, 2),
      options: { raw: { language: "json" } },
    };
  }
  const form = content.find((c) => c.mediaType === "multipart/form-data");
  if (form) {
    const properties = resolve(model, form.schema).properties as
      | Record<string, JsonSchema>
      | undefined;
    return {
      mode: "formdata",
      formdata: Object.entries(properties ?? {}).map(([key, schema]) =>
        resolve(model, schema).format === "binary"
          ? { key, type: "file", src: [] }
          : { key, value: "", type: "text" },
      ),
    };
  }
  return undefined;
}

function script(test: TestCase): string[] {
  switch (test.kind) {
    case "status":
      return [
        `pm.test("status is ${test.expected.join(" or ")}", function () {`,
        `  pm.expect(pm.response.code).to.be.oneOf(${JSON.stringify(test.expected)});`,
        "});",
      ];
    case "contentType":
      return [
        `pm.test("content type is ${test.mediaType}", function () {`,
        `  pm.expect(pm.response.headers.get("Content-Type") || "").to.include(${JSON.stringify(test.mediaType)});`,
        "});",
      ];
    case "responseTime":
      return [
        `pm.test("responds in under ${test.maxMilliseconds} ms", function () {`,
        `  pm.expect(pm.response.responseTime).to.be.below(${test.maxMilliseconds});`,
        "});",
      ];
    case "jsonSchema":
      return [
        `pm.test("matches the contract", function () {`,
        `  pm.response.to.have.jsonSchema(${JSON.stringify(test.schema)});`,
        "});",
      ];
  }
}

function toEnvironment(model: ApiModel, environment: EnvironmentDefinition): Json {
  return {
    name: `${model.info.title} ${environment.name}`,
    values: [
      ...Object.entries(environment.variables).map(([key, value]) => ({
        key,
        value,
        type: "default",
        enabled: true,
      })),
      ...environment.secrets.map((key) => ({ key, value: "", type: "secret", enabled: true })),
    ],
    _postman_variable_scope: "environment",
  };
}

function toPostmanPath(path: string): string {
  return path.replace(/\{([^}]+)\}/g, ":$1");
}

/** Without an example, a value of the right type keeps the request valid. */
function exampleOf(model: ApiModel, parameter: Parameter): string {
  const schema = resolve(model, parameter.schema);
  const enumeration = Array.isArray(schema.enum) ? schema.enum : [];
  const value = parameter.example ?? schema.example ?? schema.default ?? enumeration[0];
  if (value !== undefined) {
    return String(value);
  }
  switch (schema.type) {
    case "integer":
    case "number":
      return "1";
    case "boolean":
      return "true";
    default:
      return FORMAT_EXAMPLES[String(schema.format)] ?? "string";
  }
}

const FORMAT_EXAMPLES: Readonly<Record<string, string>> = {
  date: "2026-01-01",
  "date-time": "2026-01-01T00:00:00Z",
  uuid: "00000000-0000-0000-0000-000000000000",
  email: "user@example.com",
};

function resolve(model: ApiModel, schema: JsonSchema | undefined, depth = 0): JsonSchema {
  const ref = schema?.$ref;
  if (typeof ref === "string" && ref.startsWith("#/components/schemas/") && depth < 20) {
    return resolve(model, model.schemas[ref.slice("#/components/schemas/".length)], depth + 1);
  }
  return schema ?? {};
}

function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "api"
  );
}

function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
