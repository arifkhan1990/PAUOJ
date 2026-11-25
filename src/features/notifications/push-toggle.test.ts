import { describe, expect, it } from "vitest";
import { urlBase64ToUint8Array } from "./push-toggle";

describe("urlBase64ToUint8Array", () => {
  it("decodes a standard base64url key", () => {
    expect([...urlBase64ToUint8Array("AQID")]).toEqual([1, 2, 3]);
  });

  it("restores missing padding", () => {
    expect([...urlBase64ToUint8Array("AQI")]).toEqual([1, 2]);
  });

  it("accepts url-safe characters", () => {
    expect([...urlBase64ToUint8Array("-_8")]).toEqual([251, 255]);
  });
});
