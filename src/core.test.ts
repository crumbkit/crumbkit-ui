import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const tsc = join(root, "node_modules", ".bin", "tsc");
const prefix = "crumbkit-ui-core-";

/** Runs tsc with tsconfig.core.json's options on `source`, and returns its output when it fails. */
function checkCore(source: string): string | null {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  writeFileSync(join(directory, "probe.ts"), source);
  writeFileSync(
    join(directory, "tsconfig.json"),
    JSON.stringify({
      extends: join(root, "tsconfig.core.json"),
      files: [join(directory, "probe.ts")],
    }),
  );
  try {
    execFileSync(tsc, ["-p", join(directory, "tsconfig.json")], { encoding: "utf8" });
    return null;
  } catch (error) {
    return error instanceof Error && "stdout" in error ? String(error.stdout) : String(error);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

/** Returns the temporary directories checkCore has left behind. */
function leftBehind(): string[] {
  return readdirSync(tmpdir()).filter((name) => name.startsWith(prefix));
}

describe("the core modules' type-check", () => {
  it("fails when a core module reaches for the document, the window or fetch", () => {
    for (const global of ["document", "window", "fetch"]) {
      expect(checkCore(`export const probe = ${global};\n`)).toContain(`'${global}'`);
    }
  });

  it("removes every temporary directory it makes", () => {
    const before = leftBehind();
    checkCore("export const a = document;\n");
    checkCore("export const b = 1;\n");
    expect(leftBehind()).toEqual(before);
  });

  it("passes code that uses only the language", () => {
    expect(checkCore("export const probe = [1, 2].map((n) => n * 2);\n")).toBeNull();
  });
});
