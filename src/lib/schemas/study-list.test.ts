import { describe, expect, it } from "vitest";
import { studyListInputSchema } from "./study-list";

const base = {
  title: "Array foundations",
  description: "A short ordered path through arrays.",
  level: "BEGINNER" as const,
  estimatedMinutes: 90,
  isFeatured: false,
  isPublic: true,
  sections: [
    {
      title: "Warm-up",
      description: "Start with the basics.",
      problemIds: ["00000000-0000-4000-8000-000000000001"],
    },
    {
      title: "Core practice",
      description: "Apply the ideas.",
      problemIds: ["00000000-0000-4000-8000-000000000002"],
    },
  ],
};

describe("studyListInputSchema", () => {
  it("accepts a valid sectioned plan", () => {
    expect(studyListInputSchema.safeParse(base).success).toBe(true);
  });

  it("requires at least one section with a problem", () => {
    expect(
      studyListInputSchema.safeParse({ ...base, sections: [] }).success,
    ).toBe(false);
    expect(
      studyListInputSchema.safeParse({
        ...base,
        sections: [{ title: "Empty", description: "", problemIds: [] }],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate problems across sections", () => {
    const duplicate = {
      ...base,
      sections: [
        base.sections[0],
        {
          ...base.sections[1],
          problemIds: base.sections[0]!.problemIds,
        },
      ],
    };
    expect(studyListInputSchema.safeParse(duplicate).success).toBe(false);
  });

  it("rejects duplicate section titles", () => {
    const duplicate = {
      ...base,
      sections: [
        base.sections[0],
        { ...base.sections[1], title: "warm-up" },
      ],
    };
    expect(studyListInputSchema.safeParse(duplicate).success).toBe(false);
  });

  it("rejects invalid slugs and short estimates", () => {
    expect(
      studyListInputSchema.safeParse({ ...base, slug: "Not Valid" }).success,
    ).toBe(false);
    expect(
      studyListInputSchema.safeParse({ ...base, estimatedMinutes: 1 }).success,
    ).toBe(false);
  });

  it("defaults optional metadata", () => {
    const parsed = studyListInputSchema.parse({
      ...base,
      level: undefined,
      estimatedMinutes: undefined,
      isFeatured: undefined,
    });
    expect(parsed.level).toBe("BEGINNER");
    expect(parsed.estimatedMinutes).toBeNull();
    expect(parsed.isFeatured).toBe(false);
  });
});
