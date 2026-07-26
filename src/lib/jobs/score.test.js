import { test, expect } from "vitest";
import { scoreJob } from "./score.js";




// scoreJob ranks listings so the most hirable ones show first.
// The clearest rule: a Canadian junior role should beat a senior US one.
test("scoreJob ranks a Canadian junior role above a senior US role", () => {
  // Arrange: two jobs at opposite ends of what I want to see
  const canadianJunior = { category: "canadian", groqExp: "0-2" };
  const seniorUS       = { canadaOpen: false, groqExp: "5+" };

  // Act: score both
  const juniorScore = scoreJob(canadianJunior);
  const seniorScore = scoreJob(seniorUS);

  // Assert: the Canadian junior role ranks higher
  expect(juniorScore).toBeGreaterThan(seniorScore);
});

