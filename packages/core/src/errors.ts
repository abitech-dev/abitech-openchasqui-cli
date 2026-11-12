export type ErrorCode =
  | "invalid-config"
  | "unsupported-document"
  | "unknown-target"
  | "incompatible-plugin"
  | "unsafe-output-path";

export class OpenChasquiError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "OpenChasquiError";
    this.code = code;
  }
}
