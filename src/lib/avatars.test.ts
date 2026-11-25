import { describe, expect, it } from "vitest";
import {
  AVATAR_PRESETS,
  AVATAR_PRESET_IDS,
  avatarImageSrc,
  findAvatarPreset,
  isAvatarPresetId,
} from "./avatars";

describe("avatar presets", () => {
  it("has a unique id, label and palette for every preset", () => {
    const ids = AVATAR_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...AVATAR_PRESET_IDS]);
    for (const preset of AVATAR_PRESETS) {
      expect(preset.label.length).toBeGreaterThan(1);
      expect(preset.className).toContain("from-");
      expect(preset.className).toContain("to-");
    }
  });

  it("recognises only known preset ids", () => {
    expect(isAvatarPresetId("cat")).toBe(true);
    expect(isAvatarPresetId("dragon")).toBe(false);
    expect(isAvatarPresetId(null)).toBe(false);
    expect(findAvatarPreset("bot")?.label).toBe("Bot");
    expect(findAvatarPreset("dragon")).toBeNull();
  });

  it("builds an immutable, versioned URL from a date or string", () => {
    const url = avatarImageSrc(
      "ayesha_rahman",
      new Date("2026-11-25T10:49:19.647Z"),
    );
    expect(url).toBe(
      "/api/v1/users/ayesha_rahman/avatar?v=1795603759647",
    );
    expect(
      avatarImageSrc("ayesha_rahman", "2026-11-25T10:49:19.647Z"),
    ).toBe(url);
  });
});
