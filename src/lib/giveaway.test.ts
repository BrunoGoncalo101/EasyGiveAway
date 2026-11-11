import { describe, it, expect } from "vitest";
import { effectiveStatus } from "./giveaway";
describe("effectiveStatus", () => {
  it("closes automatically after the closing date", () => {
    expect(effectiveStatus({ status: "active", closes_at: "2020-01-01T00:00:00Z" })).toBe("closed");
  });
  it("stays active before the closing date", () => {
    expect(effectiveStatus({ status: "active", closes_at: "2999-01-01T00:00:00Z" })).toBe("active");
  });
  it("manual close wins", () => {
    expect(effectiveStatus({ status: "closed", closes_at: null })).toBe("closed");
  });
});
