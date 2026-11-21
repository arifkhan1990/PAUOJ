import { describe, expect, it } from "vitest";
import {
  SEARCHABLE_SELECT_THRESHOLD,
  computeSelectMenuPosition,
  filterSelectOptions,
  shouldEnableSelectSearch,
  type SelectOption,
} from "./select-options";

const options: SelectOption[] = [
  { value: "cpp", label: "C++ (GCC 13)" },
  { value: "python", label: "Python 3.11" },
  { value: "java", label: "Java 17" },
  { value: "go", label: "Go 1.23" },
  { value: "rust", label: "Rust 1.79" },
  { value: "kotlin", label: "Kotlin 2.0", description: "JVM target 17" },
];

describe("shouldEnableSelectSearch", () => {
  it("keeps short menus search-free", () => {
    expect(shouldEnableSelectSearch(SEARCHABLE_SELECT_THRESHOLD)).toBe(false);
    expect(shouldEnableSelectSearch(0)).toBe(false);
  });

  it("enables search when the menu has more than five options", () => {
    expect(shouldEnableSelectSearch(SEARCHABLE_SELECT_THRESHOLD + 1)).toBe(true);
    expect(shouldEnableSelectSearch(120)).toBe(true);
  });

  it("honours an explicit override", () => {
    expect(shouldEnableSelectSearch(2, true)).toBe(true);
    expect(shouldEnableSelectSearch(40, false)).toBe(false);
  });
});

describe("computeSelectMenuPosition", () => {
  const trigger = { top: 100, bottom: 140, left: 20, width: 300 };

  it("opens below the trigger when there is room", () => {
    expect(
      computeSelectMenuPosition({
        trigger,
        viewportWidth: 1000,
        viewportHeight: 800,
        canSearch: true,
      }),
    ).toEqual({
      left: 20,
      width: 300,
      top: 146,
      maxListHeight: 224,
    });
  });

  it("flips above the trigger near the bottom of the viewport", () => {
    const position = computeSelectMenuPosition({
      trigger: { top: 700, bottom: 740, left: 20, width: 300 },
      viewportWidth: 1000,
      viewportHeight: 800,
      canSearch: true,
    });
    expect(position.bottom).toBe(106);
    expect(position.top).toBeUndefined();
  });

  it("keeps the menu inside the horizontal viewport", () => {
    const position = computeSelectMenuPosition({
      trigger: { top: 100, bottom: 140, left: 900, width: 100 },
      viewportWidth: 1000,
      viewportHeight: 800,
      canSearch: false,
    });
    expect(position.width).toBe(176);
    expect(position.left).toBe(816);
  });

  it("shrinks the list to the available space and reserves the search bar", () => {
    const position = computeSelectMenuPosition({
      trigger: { top: 100, bottom: 140, left: 20, width: 300 },
      viewportWidth: 1000,
      viewportHeight: 300,
      canSearch: true,
    });
    expect(position.maxListHeight).toBe(98);
  });
});

describe("filterSelectOptions", () => {
  it("returns every option for an empty or whitespace query", () => {
    expect(filterSelectOptions(options, "")).toEqual(options);
    expect(filterSelectOptions(options, "   ")).toEqual(options);
  });

  it("matches labels case-insensitively", () => {
    expect(filterSelectOptions(options, "java")).toHaveLength(1);
    expect(filterSelectOptions(options, "PYTHON")[0]?.value).toBe("python");
  });

  it("matches option values so language ids are searchable", () => {
    expect(filterSelectOptions(options, "cpp")[0]?.label).toBe("C++ (GCC 13)");
  });

  it("matches descriptions", () => {
    expect(filterSelectOptions(options, "jvm")[0]?.value).toBe("kotlin");
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterSelectOptions(options, "fortran")).toEqual([]);
  });

  it("does not mutate the source list", () => {
    const copy = [...options];
    filterSelectOptions(options, "go");
    expect(options).toEqual(copy);
  });
});
