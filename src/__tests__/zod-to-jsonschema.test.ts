import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { zodToJsonSchema } from "../utils/zod-to-jsonschema.js";

describe("zodToJsonSchema()", () => {
  test("converts a simple object schema", () => {
    const schema = z.object({
      city: z.string(),
      count: z.number(),
    });

    const json = zodToJsonSchema(schema);

    // Zod v4 toJSONSchema returns $schema key + properties
    expect(json.type).toBe("object");
    expect(json.properties).toBeDefined();
    const props = json.properties as Record<string, any>;
    expect(props.city.type).toBe("string");
    expect(props.count.type).toBe("number");
    expect(json.required).toContain("city");
    expect(json.required).toContain("count");
  });

  test("converts string schema", () => {
    const json = zodToJsonSchema(z.string());
    expect(json.type).toBe("string");
  });

  test("converts number schema", () => {
    const json = zodToJsonSchema(z.number());
    expect(json.type).toBe("number");
  });

  test("converts boolean schema", () => {
    const json = zodToJsonSchema(z.boolean());
    expect(json.type).toBe("boolean");
  });

  test("marks required fields correctly", () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
    });

    const json = zodToJsonSchema(schema);
    const required = json.required as string[];

    expect(required).toContain("required");
    expect(required).not.toContain("optional");
  });

  test("converts nested object", () => {
    const schema = z.object({
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    });

    const json = zodToJsonSchema(schema);
    const props = json.properties as Record<string, any>;
    expect(props.location).toBeDefined();
    expect(props.location.type).toBe("object");
  });

  test("converts array schema", () => {
    const schema = z.array(z.string());
    const json = zodToJsonSchema(schema);
    expect(json.type).toBe("array");
  });
});
