import { describe, it, expect } from "vitest";
import { ProfileSchema } from "./profile.js";

describe("ProfileSchema", () => {
  it("validates a valid profile", () => {
    const profile = {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Test User",
      title: "Full Stack Developer",
      bio: "Developer based in Example City.",
      location: "Example City, Country",
      email: "test@example.com",
      github: "https://github.com/test-user",
      linkedin: null,
      website: null,
    };

    expect(ProfileSchema.parse(profile)).toEqual(profile);
  });

  it("validates with optional fields", () => {
    const profile = {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Test",
      title: "Dev",
      bio: "Bio.",
      location: "Somewhere",
      email: "test@example.com",
      github: "https://github.com/test",
      linkedin: "https://linkedin.com/in/test",
      website: "https://example.com",
    };

    expect(ProfileSchema.parse(profile)).toEqual(profile);
  });

  it("rejects invalid data", () => {
    expect(() => ProfileSchema.parse({ name: 123 })).toThrow();
  });
});
