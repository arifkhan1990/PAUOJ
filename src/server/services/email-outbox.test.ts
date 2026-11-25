import { describe, expect, it } from "vitest";
import {
  EMAIL_OUTBOX_MAX_ATTEMPTS,
  emailRetryDelayMs,
} from "./email-outbox";

const MINUTE = 60_000;

describe("notification email outbox", () => {
  it("backs off 2m, 10m, 1h then stays at 6h", () => {
    expect(emailRetryDelayMs(1)).toBe(2 * MINUTE);
    expect(emailRetryDelayMs(2)).toBe(10 * MINUTE);
    expect(emailRetryDelayMs(3)).toBe(60 * MINUTE);
    expect(emailRetryDelayMs(4)).toBe(6 * 60 * MINUTE);
    expect(emailRetryDelayMs(5)).toBe(6 * 60 * MINUTE);
  });

  it("caps retries at five attempts", () => {
    expect(EMAIL_OUTBOX_MAX_ATTEMPTS).toBe(5);
  });
});
