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
} from "@abitechdev/openchasqui-plugin-kit";
import {
  fileName,
  mostUsedScheme,
  parameterValue,
  resolveSchema,
} from "@abitechdev/openchasqui-plugin-kit";
import { stringify } from "yaml";

type Json = Record<string, unknown>;
type Variables = Required<VariableNames>;

const SETTINGS = { encodeUrl: true, timeout: 0, followRedirects: true, maxRedirects: 5 };

export const brunoEmitter: Emitter = {
  name: "@abitechdev/openchasqui/emitter-bruno",
  kind: "emitter",
  apiVersion: 1,
  target: "bruno",
  emit: async (input) => emit(input),
};

function emit({ model, environments, variables }: EmitInput): EmittedFile[] {
  const defaultScheme = mostUsedScheme(model);
  const files: EmittedFile[] = [
    { path: "opencollection.yml", contents: yaml(root(model, defaultScheme, variables)) },
    ...environments.map((environment) => ({
      path: `environments/${fileName(environment.name)}.yml`,
      contents: yaml(toEnvironment(environment)),
    })),
  ];

  const folders = [...new Set(model.operations.map((op) => op.folder.join("/")))].sort();
  for (const folder of folders) {
    const parts = folder.split("/");
    for (let depth = 1; depth <= parts.length; depth++) {
      const path = parts.slice(0, depth).map(fileName).join("/");
      if (!files.some((file) => file.path === `${path}/folder.yml`)) {
        files.push({
          path: `${path}/folder.yml`,
          contents: yaml(folderFile(parts[depth - 1] ?? "")),
        });
      }
    }
  }

  const used = new Set<string>();
  const ordered = [...model.operations].sort(
    (a, b) => a.folder.join("/").localeCompare(b.folder.join("/")) || a.order - b.order,
  );
  for (const operation of ordered) {
    const directory = operation.folder.map(fileName).join("/");
    const base = `${directory}/${fileName(operation.name)}`;
    let path = `${base}.yml`;
    for (let copy = 2; used.has(path.toLowerCase()); copy++) {
      path = `${base} (${copy}).yml`;
    }
    used.add(path.toLowerCase());
    files.push({ path, contents: yaml(request(model, operation, defaultScheme, variables)) });
  }
  return files;
}

function root(model: ApiModel, defaultScheme: string | undefined, variables: Variables): Json {
  return {
    opencollection: "1.0.0",
    info: { name: model.info.title, version: "1" },
    ...(defaultScheme
      ? { request: withAuth(auth(model.securitySchemes[defaultScheme], variables)) }
      : {}),
    ...(model.info.description
      ? { docs: { content: model.info.description, type: "text/markdown" } }
      : {}),
    bundled: false,
    extensions: { bruno: { ignore: ["node_modules", ".git"] } },
  };
}

function folderFile(name: string): Json {
  return { info: { name, type: "folder" }, request: { auth: "inherit" } };
}

function request(
  model: ApiModel,
  operation: Operation,
  defaultScheme: string | undefined,
  variables: Variables,
): Json {
  const params = operation.parameters
    .filter((p) => p.in === "query" || p.in === "path")
    .map((p) => ({
      name: p.name,
      value: parameterValue(model, p),
      type: p.in,
      ...(p.in === "query" && !p.required ? { disabled: true } : {}),
    }));
  const headers = operation.parameters
    .filter((p) => p.in === "header")
    .map((p) => ({
      name: p.name,
      value: parameterValue(model, p),
      ...(p.required ? {} : { disabled: true }),
    }));
  const body = requestBody(model, operation);
  const scripts = operation.tests.map(script).join("\n\n");
  const docs = [operation.deprecated ? "Deprecated." : "", operation.description ?? ""]
    .filter(Boolean)
    .join("\n\n");

  return {
    info: { name: operation.name, type: "http", seq: operation.order },
    http: {
      method: operation.method,
      url: `{{${variables.baseUrl}}}${operation.path.replace(/\{([^}]+)\}/g, ":$1")}`,
      ...(params.length ? { params } : {}),
      ...(headers.length ? { headers } : {}),
      ...(body ? { body } : {}),
      ...withAuth(itemAuth(model, operation, defaultScheme, variables)),
    },
    ...(scripts ? { runtime: { scripts: [{ type: "tests", code: scripts }] } } : {}),
    settings: SETTINGS,
    ...(docs ? { docs } : {}),
  };
}

function itemAuth(
  model: ApiModel,
  operation: Operation,
  defaultScheme: string | undefined,
  variables: Variables,
): unknown {
  if (operation.security.length === 0) {
    return undefined;
  }
  if (defaultScheme && operation.security.includes(defaultScheme)) {
    return "inherit";
  }
  const own = operation.security[0];
  return own ? auth(model.securitySchemes[own], variables) : "inherit";
}

/** Bruno rejects `type: none`; a request without `auth` is already public. */
function withAuth(value: unknown): Json {
  return value === undefined ? {} : { auth: value };
}

function auth(scheme: SecurityScheme | undefined, variables: Variables): Json | undefined {
  if (scheme?.type === "http" && scheme.scheme === "bearer") {
    return { type: "bearer", token: `{{${variables.token}}}` };
  }
  if (scheme?.type === "apiKey") {
    return {
      type: "apikey",
      key: scheme.name,
      value: `{{${variables.apiKey}}}`,
      placement: scheme.in === "query" ? "query" : "header",
    };
  }
  return undefined;
}

function requestBody(model: ApiModel, operation: Operation): Json | undefined {
  const content = operation.requestBody?.content ?? [];
  const json = content.find((c) => c.mediaType.includes("json"));
  if (json) {
    return { type: "json", data: JSON.stringify(json.example ?? {}, null, 2) };
  }
  const form = content.find((c) => c.mediaType === "multipart/form-data");
  if (form) {
    const properties = resolveSchema(model, form.schema).properties as
      | Record<string, JsonSchema>
      | undefined;
    return {
      type: "multipart-form",
      data: Object.entries(properties ?? {}).map(([name, schema]) =>
        resolveSchema(model, schema).format === "binary"
          ? { name, type: "file", value: [] }
          : { name, type: "text", value: "" },
      ),
    };
  }
  return undefined;
}

function script(test: TestCase): string {
  switch (test.kind) {
    case "status":
      return [
        `test("status is ${test.expected.join(" or ")}", function () {`,
        `  expect(res.getStatus()).to.be.oneOf(${JSON.stringify(test.expected)});`,
        "});",
      ].join("\n");
    case "contentType":
      return [
        `test("content type is ${test.mediaType}", function () {`,
        `  expect(res.getHeader("content-type") || "").to.include(${JSON.stringify(test.mediaType)});`,
        "});",
      ].join("\n");
    case "responseTime":
      return [
        `test("responds in under ${test.maxMilliseconds} ms", function () {`,
        `  expect(res.getResponseTime()).to.be.below(${test.maxMilliseconds});`,
        "});",
      ].join("\n");
    case "jsonSchema":
      return [
        `test("matches the contract", function () {`,
        `  const Ajv = require("ajv");`,
        `  const ajv = new Ajv({ strict: false, allErrors: true });`,
        `  const valid = ajv.validate(${JSON.stringify(test.schema)}, res.getBody());`,
        "  expect(valid, ajv.errorsText()).to.equal(true);",
        "});",
      ].join("\n");
  }
}

function toEnvironment(environment: EnvironmentDefinition): Json {
  return {
    name: environment.name,
    variables: [
      ...Object.entries(environment.variables).map(([name, value]) => ({ name, value })),
      ...environment.secrets.map((name) => ({ name, secret: true })),
    ],
  };
}

function yaml(value: unknown): string {
  return stringify(value, { lineWidth: 0 });
}
