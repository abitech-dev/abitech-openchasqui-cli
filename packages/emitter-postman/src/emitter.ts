import {
  mostUsedScheme,
  parameterValue,
  resolveSchema,
  slugify,
} from "@abitech/openchasqui-plugin-kit";
import type {
  ApiModel,
  EmitInput,
  EmittedFile,
  Emitter,
  EnvironmentDefinition,
  JsonSchema,
  Operation,
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
    (enabled.length
      ? `?${enabled.map((p) => `${p.name}=${parameterValue(model, p)}`).join("&")}`
      : "");
  const body = requestBody(model, operation);
  const headers = operation.parameters
    .filter((p) => p.in === "header")
    .map((p) => ({ key: p.name, value: parameterValue(model, p), disabled: !p.required }));
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
                value: parameterValue(model, p),
                disabled: !p.required,
              })),
            }
          : {}),
        ...(operation.parameters.some((p) => p.in === "path")
          ? {
              variable: operation.parameters
                .filter((p) => p.in === "path")
                .map((p) => ({ key: p.name, value: parameterValue(model, p) })),
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
    const properties = resolveSchema(model, form.schema).properties as
      | Record<string, JsonSchema>
      | undefined;
    return {
      mode: "formdata",
      formdata: Object.entries(properties ?? {}).map(([key, schema]) =>
        resolveSchema(model, schema).format === "binary"
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

function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
