/*
 * Test setup.
 * Adds jest-dom matchers (toBeInTheDocument, etc.) and clears the DOM
 * between tests so component tests start from a clean slate.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
