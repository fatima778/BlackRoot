import { meetsClearance, isValidRole, rankOf } from "../utils/roles";

describe("clearance hierarchy", () => {
  it("orders roles guest < verified < operative < sysadmin", () => {
    expect(rankOf("guest")).toBeLessThan(rankOf("verified"));
    expect(rankOf("verified")).toBeLessThan(rankOf("operative"));
    expect(rankOf("operative")).toBeLessThan(rankOf("sysadmin"));
  });

  it("allows equal or higher clearance", () => {
    expect(meetsClearance("sysadmin", "guest")).toBe(true);
    expect(meetsClearance("operative", "operative")).toBe(true);
  });

  it("blocks lower clearance", () => {
    expect(meetsClearance("guest", "verified")).toBe(false);
    expect(meetsClearance("verified", "sysadmin")).toBe(false);
  });

  it("rejects unknown role strings", () => {
    expect(isValidRole("root")).toBe(false);
    expect(isValidRole("sysadmin")).toBe(true);
    expect(isValidRole(123)).toBe(false);
  });
});
