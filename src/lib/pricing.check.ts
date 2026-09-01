// Standing self-check for the money math. Run: npx tsx src/lib/pricing.check.ts
// No test framework on purpose - just asserts that fail loud if pricing breaks.
import assert from "node:assert";
import { computePricing } from "./pricing";
import type { ExtractionResult, PricingItem } from "../types";

const catalog: PricingItem[] = [
  { id: "t1", sku: "ART-TURF-001", name: "Turf", description: null, category: "turf", unit: "sqft", unit_price: 12.5, active: true },
  { id: "p1", sku: "PERGOLA-001", name: "Pergola", description: null, category: "structure", unit: "each", unit_price: 9500, active: true },
];

const extraction: ExtractionResult = {
  project_type: "backyard renovation",
  project_summary: "test",
  scope_items: [
    // clean match: 600 * 12.5 = 7500
    { description: "Artificial turf", quantity: 600, quantity_status: "explicit", unit: "sqft", confidence: 0.96, matched_sku: "ART-TURF-001", match_confidence: 0.98, source_text: "600 sqft turf" },
    // derived qty, good match: 1 * 9500 = 9500
    { description: "Pergola", quantity: 1, quantity_status: "derived", unit: "each", confidence: 0.9, matched_sku: "PERGOLA-001", match_confidence: 0.9, source_text: "12x14 pergola" },
    // no match -> null price + needs_review, contributes 0 to subtotal
    { description: "Outdoor kitchen", quantity: 1, quantity_status: "explicit", unit: "each", confidence: 0.8, matched_sku: null, match_confidence: 0, source_text: "outdoor kitchen" },
    // matched but inferred qty -> priced but flagged: 400 * 12.5 = 5000
    { description: "More turf", quantity: 400, quantity_status: "inferred", unit: "sqft", confidence: 0.6, matched_sku: "ART-TURF-001", match_confidence: 0.8, source_text: "the rest in turf" },
  ],
  assumptions: [],
  exclusions: [],
  potential_addons: [],
  unknowns: [],
};

const out = computePricing(extraction, catalog);

assert.strictEqual(out.items[0].line_total, 7500, "clean turf line");
assert.strictEqual(out.items[0].needs_review, false, "clean line not flagged");
assert.strictEqual(out.items[1].line_total, 9500, "pergola line");
assert.strictEqual(out.items[2].line_total, null, "unmatched item has no price");
assert.strictEqual(out.items[2].needs_review, true, "unmatched item flagged");
assert.strictEqual(out.items[3].line_total, 5000, "inferred-qty item still priced");
assert.strictEqual(out.items[3].needs_review, true, "inferred-qty item flagged");
assert.strictEqual(out.subtotal, 22000, "subtotal = 7500 + 9500 + 0 + 5000");
assert.strictEqual(out.total, 22000, "no discount");
assert.strictEqual(out.needs_review, true, "proposal needs review");

console.log("✓ pricing self-check passed:", { subtotal: out.subtotal, flags: out.review_reasons.length });
