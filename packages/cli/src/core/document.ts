import { parse } from "yaml";

/** Parses JSON or YAML; JSON is valid YAML, so one parser covers both. */
export function parseDocument(text: string): unknown {
  return parse(text, { maxAliasCount: 100 });
}
