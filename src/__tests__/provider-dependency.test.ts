import { describe, expect, mock, test } from "bun:test";
import {
  assertProviderDependencyInstalled,
  getProviderDependency,
} from "../utils/provider-dependency.js";

describe("provider dependency preflight", () => {
  test("returns dependency info for built-in providers", () => {
    expect(getProviderDependency("copilot")).toEqual({
      pkg: "@github/copilot-sdk",
      installHint: "bun add @github/copilot-sdk",
    });
    expect(getProviderDependency("openrouter")).toEqual({
      pkg: "openai",
      installHint: "bun add openai",
    });
  });

  test("returns undefined for custom providers", () => {
    expect(getProviderDependency("my-custom-provider")).toBeUndefined();
  });

  test("does nothing for custom providers", async () => {
    const importer = mock(async (_pkg: string) => ({}));
    await expect(assertProviderDependencyInstalled("my-custom-provider", importer)).resolves.toBe(
      undefined,
    );
    expect(importer).not.toHaveBeenCalled();
  });

  test("throws a clear install error when dependency is missing", async () => {
    const importer = mock(async (_pkg: string) => {
      throw new Error("missing");
    });

    await expect(assertProviderDependencyInstalled("copilot", importer)).rejects.toThrow(
      'Provider "copilot" requires @github/copilot-sdk. Install it with: bun add @github/copilot-sdk',
    );
  });

  test("passes when provider dependency is installed", async () => {
    const importer = mock(async (_pkg: string) => ({}));

    await expect(assertProviderDependencyInstalled("copilot", importer)).resolves.toBe(undefined);
    expect(importer).toHaveBeenCalledWith("@github/copilot-sdk");
  });
});
