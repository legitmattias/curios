import { describe, it, expect } from "vitest";
import { CvDataSchema } from "./cv.js";

describe("CvDataSchema", () => {
  it("validates a complete CV data object", () => {
    const cv = {
      profile: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Test User",
        title: "Developer",
        bio: "A developer.",
        location: "Stockholm",
        email: "test@example.com",
        github: "https://github.com/test",
        linkedin: null,
        website: null,
      },
      experience: [
        {
          id: "00000000-0000-0000-0000-000000000002",
          company: "Acme",
          role: "Dev",
          description: "Built things.",
          startDate: "2023-01-01",
          endDate: null,
          tech: ["TypeScript"],
          sortOrder: 0,
        },
      ],
      skills: [
        {
          id: "00000000-0000-0000-0000-000000000003",
          name: "TypeScript",
          category: "Languages",
          sortOrder: 0,
        },
      ],
      education: [
        {
          id: "00000000-0000-0000-0000-000000000004",
          institution: "University",
          degree: "BSc",
          field: "CS",
          startDate: "2020-09-01",
          endDate: "2023-06-15",
          description: null,
          sortOrder: 0,
        },
      ],
      projects: [
        {
          id: "00000000-0000-0000-0000-000000000005",
          slug: "test-project",
          title: "Test",
          description: "A project.",
          tech: [{ name: "TypeScript", description: null }],
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    };

    expect(CvDataSchema.parse(cv)).toEqual(cv);
  });

  it("validates with empty arrays", () => {
    const cv = {
      profile: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Test",
        title: "Dev",
        bio: "Bio.",
        location: "Here",
        email: "test@test.com",
        github: "https://github.com/test",
        linkedin: null,
        website: null,
      },
      experience: [],
      skills: [],
      education: [],
      projects: [],
    };

    expect(CvDataSchema.parse(cv)).toEqual(cv);
  });

  it("rejects missing profile", () => {
    expect(() =>
      CvDataSchema.parse({
        experience: [],
        skills: [],
        education: [],
        projects: [],
      }),
    ).toThrow();
  });
});
