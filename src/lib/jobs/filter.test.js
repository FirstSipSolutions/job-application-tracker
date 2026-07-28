import { test, expect } from "vitest";
import { isRemote, isTech, getCountry, isFresh } from "./filter.js";

test("a remote job passes, a hybrid job does not", () => {
  const remoteJob = { workplaceType: "Remote" };
  const hybridJob = { workplaceType: "Hybrid" };

  expect(isRemote(remoteJob)).toBe(true);
  expect(isRemote(hybridJob)).toBe(false);
});

test("a dev role passes, a non-dev role does not", () => {
  const devJob = { title: "Software Engineer" };
  const nonDevJob = { title: "Product Manager" };

  expect(isTech(devJob)).toBe(true);
  expect(isTech(nonDevJob)).toBe(false);
});

test("a Canadian location reads as CA", () => {
  const job = { location: "Remote, Canada" };

  expect(getCountry(job)).toBe("CA");
});

test("a job with no date is not fresh", () => {
  const undatedJob = {};

  expect(isFresh(undatedJob)).toBe(false);
});
