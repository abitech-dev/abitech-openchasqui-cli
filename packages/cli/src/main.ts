import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { OpenChasquiError } from "./core/index.js";
import { generate } from "./generate.js";
import { init } from "./init.js";
import type { Console } from "./project.js";
import { verify } from "./verify.js";

const DEFAULT_CONFIG = "openchasqui.config.yaml";
const COMMANDS = { generate, verify, init } as const;

const HELP = `Usage: openchasqui <command> [options]

Commands:
  init       Create a configuration for the OpenAPI document in this folder
  generate   Emit the collections for every target in the configuration
  verify     Check policies and that the collections on disk are up to date

Options:
  -c, --config <file>   Configuration file (default: ${DEFAULT_CONFIG})
  -h, --help            Show this help
  -v, --version         Show the version
`;

/** Runs the command line and returns the process exit code. */
export async function main(argv: readonly string[], output: Console = console): Promise<number> {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: {
      config: { type: "string", short: "c", default: DEFAULT_CONFIG },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
  });

  if (values.version) {
    output.log(await version());
    return 0;
  }
  const [command] = positionals;
  if (values.help || !command) {
    output.log(HELP);
    return values.help ? 0 : 1;
  }
  if (!(command in COMMANDS)) {
    output.error(`Unknown command "${command}".\n\n${HELP}`);
    return 1;
  }

  try {
    return await COMMANDS[command as keyof typeof COMMANDS](resolve(values.config), output);
  } catch (error) {
    if (error instanceof OpenChasquiError) {
      output.error(`error ${error.code}: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

async function version(): Promise<string> {
  const manifest = new URL("../package.json", import.meta.url);
  return (JSON.parse(await readFile(manifest, "utf8")) as { version: string }).version;
}
