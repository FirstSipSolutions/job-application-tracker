import { test, expect } from "vitest";
import { isRemote, isTech, getCountry } from "./filter.js";

// The filter decides which jobs reach the user. These cover the main gates:
// remote-only, dev roles, and reading the country from a location string.

test("isRemote keeps remote roles and drops hybrid ones", () => {
  expect(isRemote({ workplaceType: "Remote" })).toBe(true);
  expect(isRemote({ workplaceType: "Hybrid" })).toBe(false);
});

test("isTech keeps dev roles and drops non-dev ones", () => {
  expect(isTech({ title: "Software Engineer" })).toBe(true);
  expect(isTech({ title: "Product Manager" })).toBe(false);
});

test("getCountry reads Canada from the location", () => {
  expect(getCountry({ location: "Remote, Canada" })).toBe("CA");
});
