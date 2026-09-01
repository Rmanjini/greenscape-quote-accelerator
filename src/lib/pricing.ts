import type { ExtractionResult, PricingItem, QuantityStatus } from "@/types";

// Thresholds that decide when a human must look. Tuned conservatively:
// money is on the line, so we'd rather over-flag than auto-price a guess.
export const MATCH_THRESHOLD = 0.75; // below this, don't trust the SKU match
export const SCOPE_THRESHOLD = 0.5; // below this, scope itself is shaky

export interface PricedItem {
  pricing_item_id: string | null;
  description: string;
  quantity: number | null;
  quantity_status: QuantityStatus;
  unit: string | null;
  unit_price: number | null;
  line_total: number | null;
  confidence: number;
  match_confidence: number;
  source_text: string;
  needs_review: boolean;
  review_reason: string | null;
}

export interface PricingOutcome {
  items: PricedItem[];
  subtotal: number;
  discount: number;
  total: number;
  needs_review: boolean;
  review_reasons: string[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Deterministic pricing. The LLM proposed SKU+quantity; here the app looks up
// the authoritative unit_price from the catalog and does the arithmetic.
// If anything is uncertain, price stays null and the item is flagged.
export function computePricing(
  extraction: ExtractionResult,
  catalog: PricingItem[]
): PricingOutcome {
  const bySku = new Map(catalog.map((c) => [c.sku, c]));
  const reasons = new Set<string>();

  const items: PricedItem[] = extraction.scope_items.map((it) => {
    const match = it.matched_sku ? bySku.get(it.matched_sku) : undefined;
    let needs_review = false;
    let reason: string | null = null;

    const flag = (r: string) => {
      needs_review = true;
      reason = reason ? `${reason}; ${r}` : r;
      reasons.add(r);
    };

    if (!match || it.match_confidence < MATCH_THRESHOLD) {
      flag(`No confident catalog match for "${it.description}"`);
    }
    if (it.confidence < SCOPE_THRESHOLD) {
      flag(`Low-confidence scope item: "${it.description}"`);
    }
    if (it.quantity == null || it.quantity_status === "unknown") {
      flag(`Quantity missing for "${it.description}"`);
    } else if (it.quantity_status === "inferred") {
      flag(`Quantity inferred (not stated) for "${it.description}"`);
    }
    // Unit sanity: if the model's unit disagrees with the catalog unit, flag it
    // but still let the catalog unit drive the math.
    if (match && it.unit && it.unit !== match.unit) {
      flag(`Unit mismatch for "${it.description}" (notes: ${it.unit}, catalog: ${match.unit})`);
    }

    // Price only when we have a real SKU AND a usable quantity. Otherwise null.
    const unit_price = match ? match.unit_price : null;
    const line_total =
      unit_price != null && it.quantity != null ? round2(it.quantity * unit_price) : null;

    return {
      pricing_item_id: match?.id ?? null,
      description: it.description,
      quantity: it.quantity,
      quantity_status: it.quantity_status,
      unit: match?.unit ?? it.unit,
      unit_price,
      line_total,
      confidence: it.confidence,
      match_confidence: it.match_confidence,
      source_text: it.source_text,
      needs_review,
      review_reason: reason,
    };
  });

  // Subtotal sums every priced line (flagged or not) so Marcus sees a working
  // number; flagged lines are still called out in the UI for him to fix.
  const subtotal = round2(items.reduce((s, i) => s + (i.line_total ?? 0), 0));
  const discount = 0; // never auto-discount (guardrail #5)
  const total = round2(subtotal - discount);

  return {
    items,
    subtotal,
    discount,
    total,
    needs_review: items.some((i) => i.needs_review),
    review_reasons: Array.from(reasons),
  };
}
