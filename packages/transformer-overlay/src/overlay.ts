import type { DocumentTransformer, Finding, PluginContext } from "@abitechdev/openchasqui-spec";
import { JSONPathError, jsonpath } from "json-p3";
import { parse } from "yaml";

type Json = Record<string, unknown>;
type QueryInput = Parameters<typeof jsonpath.query>[1];

const RULE = "overlay";

export const overlayTransformer: DocumentTransformer = {
  name: "@abitechdev/openchasqui-transformer-overlay",
  kind: "document-transformer",
  apiVersion: 1,
  transformDocument: async (document, context) => apply(document, context),
};

async function apply(document: unknown, context: PluginContext) {
  const files = (context.options.overlays as readonly string[] | undefined) ?? [];
  const findings: Finding[] = [];
  const result = structuredClone(document);
  for (const file of files) {
    const overlay = parse(await context.reader.readText(file), { maxAliasCount: 100 }) as Json;
    const problem = invalidOverlay(overlay);
    if (problem) {
      findings.push({ rule: RULE, severity: "error", message: problem, file });
      continue;
    }
    for (const [index, action] of (overlay.actions as Json[]).entries()) {
      findings.push(...applyAction(result, action, `${file} action ${index + 1}`));
    }
  }
  return { document: result, findings };
}

function invalidOverlay(overlay: Json): string | undefined {
  if (typeof overlay.overlay !== "string" || !overlay.overlay.startsWith("1.")) {
    return 'The "overlay" field must name a 1.x version of the Overlay Specification.';
  }
  if (!Array.isArray(overlay.actions) || overlay.actions.length === 0) {
    return 'An overlay needs at least one entry in "actions".';
  }
  const target = (overlay.actions as Json[]).findIndex(
    (action) => typeof action?.target !== "string",
  );
  return target === -1 ? undefined : `Action ${target + 1} has no "target" JSONPath.`;
}

function applyAction(document: unknown, action: Json, where: string): Finding[] {
  let nodes: { value: unknown; location: readonly (string | number)[] }[];
  try {
    nodes = [...jsonpath.query(String(action.target), document as QueryInput)];
  } catch (error) {
    if (error instanceof JSONPathError) {
      return [errorFinding(`${where} has an invalid target: ${error.message}`)];
    }
    throw error;
  }
  if (nodes.length === 0) {
    return [
      { rule: RULE, severity: "warning", message: `${where} targets nothing: ${action.target}` },
    ];
  }

  if (action.remove === true) {
    remove(
      document,
      nodes.map((node) => node.location),
    );
    return [];
  }
  if (action.update === undefined) {
    return [];
  }
  const findings: Finding[] = [];
  for (const node of nodes) {
    if (Array.isArray(node.value)) {
      node.value.push(structuredClone(action.update));
    } else if (isObject(node.value) && isObject(action.update)) {
      merge(node.value, action.update);
    } else {
      findings.push(
        errorFinding(
          `${where} must target objects or arrays, and update an object with an object.`,
        ),
      );
    }
  }
  return findings;
}

/** Merges objects recursively; any other value replaces the old one. */
function merge(target: Json, update: Json): void {
  for (const [key, value] of Object.entries(update)) {
    const current = target[key];
    if (isObject(current) && isObject(value)) {
      merge(current, value);
    } else {
      target[key] = structuredClone(value);
    }
  }
}

/** Removes the deepest and last nodes first, so indexes stay valid. */
function remove(document: unknown, locations: readonly (readonly (string | number)[])[]): void {
  const ordered = [...locations].sort((a, b) => b.length - a.length || compareLast(b, a));
  for (const location of ordered) {
    const key = location.at(-1);
    const parent = location
      .slice(0, -1)
      .reduce<unknown>((node, part) => (node as Json)?.[part], document);
    if (Array.isArray(parent) && typeof key === "number") {
      parent.splice(key, 1);
    } else if (isObject(parent) && key !== undefined) {
      delete parent[String(key)];
    }
  }
}

function compareLast(a: readonly (string | number)[], b: readonly (string | number)[]): number {
  const x = a.at(-1);
  const y = b.at(-1);
  return typeof x === "number" && typeof y === "number" ? x - y : 0;
}

function isObject(value: unknown): value is Json {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function errorFinding(message: string): Finding {
  return { rule: RULE, severity: "error", message };
}
