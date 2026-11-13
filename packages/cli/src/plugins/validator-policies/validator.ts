import type { ApiModel, Finding, Operation, Validator } from "@abitechdev/openchasqui-plugin-kit";

const SECRETS: readonly { readonly pattern: RegExp; readonly what: string }[] = [
  { pattern: /eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]+/, what: "a JWT" },
  { pattern: /AKIA[0-9A-Z]{16}/, what: "an AWS access key" },
  { pattern: /\bgh[pousr]_\w{30,}|github_pat_\w{20,}/, what: "a GitHub token" },
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, what: "a private key" },
];

/** Domains reserved for examples by RFC 2606 and RFC 6761. */
const RESERVED_EMAIL = /@([\w-]+\.)*(example\.(com|org|net)|test|invalid|localhost)$/i;
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const WRITES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const policiesValidator: Validator = {
  name: "@abitechdev/openchasqui/validator-policies",
  kind: "validator",
  apiVersion: 1,
  validate: async (model) => model.operations.flatMap((op) => check(model, op)),
};

function check(model: ApiModel, operation: Operation): Finding[] {
  const findings: Finding[] = [];
  const at = { operationId: operation.id };
  const examples = JSON.stringify([
    operation.parameters.map((p) => p.example),
    operation.requestBody?.content.map((c) => c.example),
  ]);

  for (const secret of SECRETS) {
    if (secret.pattern.test(examples)) {
      findings.push({
        rule: "no-secrets-in-examples",
        severity: "error",
        message: `An example contains what looks like ${secret.what}. Use a placeholder instead.`,
        ...at,
      });
    }
  }
  for (const email of new Set(examples.match(EMAIL) ?? [])) {
    if (!RESERVED_EMAIL.test(email)) {
      findings.push({
        rule: "reserved-email-domains",
        severity: "warning",
        message: `${email} may belong to a real person. Use a domain reserved for examples, such as example.com.`,
        ...at,
      });
    }
  }
  if (!operation.responses.some((response) => /^2/.test(response.status))) {
    findings.push({
      rule: "success-response",
      severity: "warning",
      message: "No 2xx response is documented, so the status cannot be tested.",
      ...at,
    });
  }
  const hasAuth = Object.keys(model.securitySchemes).length > 0;
  if (hasAuth && WRITES.has(operation.method) && operation.security.length === 0) {
    findings.push({
      rule: "public-write",
      severity: "warning",
      message: `${operation.method} ${operation.path} changes data without authentication. Confirm it is intended.`,
      ...at,
    });
  }
  return findings;
}
