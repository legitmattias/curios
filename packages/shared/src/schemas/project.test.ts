import { describe, it, expect } from "vitest";
import { ProjectSchema } from "./index.js";

describe("ProjectSchema", () => {
  it("validates a valid project", () => {
    const project = {
      id: "00000000-0000-0000-0000-000000000001",
      slug: "test-project",
      title: "Test Project",
      description: "A test project",
      tech: [
        { name: "TypeScript", description: null },
        { name: "Hono", description: null },
      ],
      createdAt: "2026-03-30T00:00:00Z",
      updatedAt: "2026-03-30T00:00:00Z",
    };

    expect(ProjectSchema.parse(project)).toEqual(project);
  });

  it("rejects invalid data", () => {
    expect(() => ProjectSchema.parse({ title: 123 })).toThrow();
  });
});
