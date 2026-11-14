import { copyFile, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MARKER, main } from "../src/index.js";

const CONFIG = `version: 1
source: petstore.yaml
targets: [postman]
output: collections
environments:
  qa:
    variables:
      baseUrl: https://qa.example.com
    secrets: [token]
`;

let folder: string;
const lines = { log: [] as string[], error: [] as string[] };
const output = { log: (m: string) => lines.log.push(m), error: (m: string) => lines.error.push(m) };

async function generate(config = CONFIG): Promise<number> {
  await writeFile(join(folder, "openchasqui.config.yaml"), config, "utf8");
  return main(["generate", "--config", join(folder, "openchasqui.config.yaml")], output);
}

beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), "openchasqui-"));
  await copyFile(
    new URL("../../../fixtures/petstore.yaml", import.meta.url),
    join(folder, "petstore.yaml"),
  );
  lines.log = [];
  lines.error = [];
});

afterEach(async () => {
  await rm(folder, { recursive: true, force: true });
});

describe("openchasqui generate", () => {
  it("writes each target in its own folder, marked as generated", async () => {
    expect(await generate()).toBe(0);

    expect((await readdir(join(folder, "collections", "postman"))).sort()).toEqual([
      MARKER,
      "petstore-qa.postman_environment.json",
      "petstore.postman_collection.json",
    ]);
  });

  it("removes files from a previous run that no longer apply", async () => {
    await generate();
    await writeFile(join(folder, "collections", "postman", "old.json"), "{}", "utf8");

    await generate();

    expect(await readdir(join(folder, "collections", "postman"))).not.toContain("old.json");
  });

  it("never empties a folder it did not create", async () => {
    await writeFile(join(folder, "keep.txt"), "mine", "utf8");

    const code = await generate(CONFIG.replace("output: collections", "output: ."));

    expect(code).toBe(0);
    expect(await readFile(join(folder, "keep.txt"), "utf8")).toBe("mine");
  });

  it("refuses a target folder with files it did not write", async () => {
    await writeFile(join(folder, "openchasqui.config.yaml"), CONFIG, "utf8");
    const target = join(folder, "collections", "postman");
    await import("node:fs/promises").then((fs) => fs.mkdir(target, { recursive: true }));
    await writeFile(join(target, "notes.md"), "mine", "utf8");

    expect(await generate()).toBe(1);
    expect(lines.error.join("\n")).toContain("unsafe-output-path");
    expect(await readFile(join(target, "notes.md"), "utf8")).toBe("mine");
  });

  it("reports an invalid configuration without a stack trace", async () => {
    expect(await generate(CONFIG.replace("qa:", "production:"))).toBe(1);
    expect(lines.error.join("\n")).toMatch(/^error invalid-config: .*production/);
  });

  it("reports a missing source document without a stack trace", async () => {
    expect(await generate(CONFIG.replace("petstore.yaml", "missing.yaml"))).toBe(1);
    expect(lines.error.join("\n")).toMatch(/^error missing-file: .*missing\.yaml/);
  });

  it("reports a missing configuration file without a stack trace", async () => {
    expect(await main(["generate", "--config", join(folder, "none.yaml")], output)).toBe(1);
    expect(lines.error.join("\n")).toMatch(/^error missing-file: .*none\.yaml/);
  });

  it("shows help and rejects unknown commands", async () => {
    expect(await main(["--help"], output)).toBe(0);
    expect(await main(["deploy"], output)).toBe(1);
    expect(lines.error.join("\n")).toContain('Unknown command "deploy"');
  });
});

describe("openchasqui verify", () => {
  async function verify(): Promise<number> {
    return main(["verify", "--config", join(folder, "openchasqui.config.yaml")], output);
  }

  it("passes when the collections on disk match the contract", async () => {
    await generate();
    lines.log = [];

    expect(await verify()).toBe(0);
    expect(lines.log).toEqual(["postman: up to date"]);
  });

  it("fails when a generated file was edited by hand", async () => {
    await generate();
    await writeFile(
      join(folder, "collections", "postman", "petstore.postman_collection.json"),
      "{}",
      "utf8",
    );

    expect(await verify()).toBe(1);
    expect(lines.error).toContain("  outdated petstore.postman_collection.json");
  });

  it("fails when the folder has a file the contract no longer produces", async () => {
    await generate();
    await writeFile(join(folder, "collections", "postman", "old.json"), "{}", "utf8");

    expect(await verify()).toBe(1);
    expect(lines.error).toContain("  unexpected old.json");
  });

  it("fails when the collections were never generated", async () => {
    await writeFile(join(folder, "openchasqui.config.yaml"), CONFIG, "utf8");

    expect(await verify()).toBe(1);
    expect(lines.error).toContain("  missing petstore.postman_collection.json");
  });
});

describe("openchasqui init", () => {
  it("creates a configuration for the contract it finds, with its first server", async () => {
    await copyFile(join(folder, "petstore.yaml"), join(folder, "openapi.yaml"));

    expect(await main(["init", "--config", join(folder, "openchasqui.config.yaml")], output)).toBe(
      0,
    );
    const created = await readFile(join(folder, "openchasqui.config.yaml"), "utf8");
    expect(created).toContain("source: openapi.yaml");
    expect(created).toContain("baseUrl: https://api.example.com/v1");
  });

  it("never overwrites an existing configuration", async () => {
    await writeFile(join(folder, "openchasqui.config.yaml"), "mine", "utf8");

    expect(await main(["init", "--config", join(folder, "openchasqui.config.yaml")], output)).toBe(
      1,
    );
    expect(await readFile(join(folder, "openchasqui.config.yaml"), "utf8")).toBe("mine");
  });
});
