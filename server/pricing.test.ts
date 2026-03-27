import { describe, it, expect } from "vitest";

// ── Pricing Engine Logic (pure functions, no DB) ──────────────

function calculateFinalPrice(
  basePrice: number,
  variableModifiers: number[],
  variableCategories: string[],
  complexityMultiplier: number,
  quantity: number
): { materials: number; addons: number; total: number } {
  let materials = 0;
  let addons = 0;
  for (let i = 0; i < variableModifiers.length; i++) {
    if (variableCategories[i] === "addon") addons += variableModifiers[i];
    else materials += variableModifiers[i];
  }
  const total = Math.round((basePrice + materials + addons) * complexityMultiplier * quantity);
  return { materials, addons, total };
}

describe("Pricing Engine", () => {
  it("calculates basic price with no modifiers", () => {
    const result = calculateFinalPrice(8000, [], [], 1.0, 1);
    expect(result.total).toBe(8000);
    expect(result.materials).toBe(0);
    expect(result.addons).toBe(0);
  });

  it("adds material modifiers correctly", () => {
    const result = calculateFinalPrice(8000, [2000, 1500], ["fabric", "hardware"], 1.0, 1);
    expect(result.materials).toBe(3500);
    expect(result.total).toBe(11500);
  });

  it("separates addon modifiers from material modifiers", () => {
    const result = calculateFinalPrice(8000, [2000, 800], ["fabric", "addon"], 1.0, 1);
    expect(result.materials).toBe(2000);
    expect(result.addons).toBe(800);
    expect(result.total).toBe(10800);
  });

  it("applies complexity multiplier correctly", () => {
    const result = calculateFinalPrice(8000, [2000], ["fabric"], 1.6, 1);
    // (8000 + 2000) * 1.6 = 16000
    expect(result.total).toBe(16000);
  });

  it("applies quantity multiplier correctly", () => {
    const result = calculateFinalPrice(8000, [], [], 1.0, 3);
    expect(result.total).toBe(24000);
  });

  it("matches the example from the spec: Upholstered 160cm + Velvet + High Headboard + Mechanism = 14,500", () => {
    // Base = 8000, Velvet = +2000, High Headboard = +1500, Mechanism = +3000
    // Standard multiplier = 1.0 (no complexity applied in original example)
    const result = calculateFinalPrice(
      8000,
      [2000, 1500, 3000],
      ["fabric", "hardware", "addon"],
      1.0,
      1
    );
    expect(result.total).toBe(14500);
  });

  it("rounds to nearest integer", () => {
    const result = calculateFinalPrice(8000, [1000], ["material"], 1.25, 1);
    // (8000 + 1000) * 1.25 = 11250
    expect(result.total).toBe(11250);
    expect(Number.isInteger(result.total)).toBe(true);
  });

  it("handles premium complexity multiplier", () => {
    const result = calculateFinalPrice(8000, [], [], 1.6, 1);
    expect(result.total).toBe(12800);
  });

  it("handles custom complexity multiplier (×2)", () => {
    const result = calculateFinalPrice(8000, [], [], 2.0, 1);
    expect(result.total).toBe(16000);
  });
});
