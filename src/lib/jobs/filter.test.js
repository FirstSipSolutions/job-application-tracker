/*
 * Starter tests for the job filter.
 * Proves the harness works; I'll grow the cases as I harden the gate.
 */
import { describe, it, expect } from "vitest";
import { getCountry, isFresh } from "./filter.js";

describe("getCountry", () => {
  it("reads Canada from the location", () => {
    expect(getCountry({ location: "Remote, Canada" })).toBe("CA");
  });

  it("returns null when there is nothing to go on", () => {
    expect(getCountry({})).toBe(null);
  });
});

describe("isFresh", () => {
  it("keeps a job posted today", () => {
    expect(isFresh({ postedAt: new Date().toISOString() })).toBe(true);
  });

  it("drops a job with no date", () => {
    expect(isFresh({})).toBe(false);
  });
});
