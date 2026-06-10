import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./system-prompt";

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt();

  it("identifies the BlueRoute advisor", () => {
    expect(prompt).toContain("BlueRoute AI Advisor");
  });
  it("includes a real service and a real port", () => {
    expect(prompt).toContain("Ocean Freight");
    expect(prompt).toContain("Rotterdam");
  });
  it("states the no-binding-quotes guardrail and CTA convention", () => {
    expect(prompt.toLowerCase()).toContain("never invent");
    expect(prompt).toContain("CTA:");
  });
});
