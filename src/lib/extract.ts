import OpenAI from "openai";
import type { ExtractionResult, ExtractedItem, PricingItem } from "@/types";

export const PROMPT_VERSION = "extract-v1";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Lazy init: don't construct the client at import time (throws without a key,
// which would break `next build` in CI where the key isn't present).
let _client: OpenAI | null = null;
const client = () => (_client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));

// Condensed guardrails from the master system prompt. The load-bearing rules:
// never invent prices/quantities/materials; SKU must come from the catalog;
// unknown -> flag, don't fill. The app does all math.
const SYSTEM = `You are the Quote Intelligence Agent for Greenscape Pro, a premium
Phoenix hardscape/landscape design-build company. You turn messy site-walk notes
into a STRUCTURED scope for a human (Marcus) to review. You prepare; Marcus approves.

HARD RULES:
- You NEVER output prices or money. You only identify scope, quantities, and the
  best-matching catalog SKU. The application computes all pricing from its database.
- matched_sku MUST be one of the SKUs in the provided catalog, or null. Never invent a SKU.
- Use quantities explicitly stated. A quantity you can compute deterministically from
  explicit dimensions (e.g. "12x14 pergola" -> 168 sqft) is quantity_status "derived".
  A quantity you guessed/implied is "inferred". If there is no basis at all, quantity
  is null and quantity_status is "unknown".
- Never invent materials, specs, dimensions, exclusions, or requirements.
- If the customer mentions something "maybe later" / "eventually", it is a
  potential_addon, NOT a scope_item.
- If a scope item has no confident catalog match, set matched_sku=null and
  match_confidence=0. It is better to flag than to force a wrong SKU.
- confidence and match_confidence are 0..1. High confidence in an INFERENCE is still
  an inference - reflect uncertainty honestly.
- Put anything ambiguous, missing, or needing a human decision into "unknowns".`;

// Strict JSON schema so the model must return exactly this shape.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "project_type",
    "project_summary",
    "scope_items",
    "assumptions",
    "exclusions",
    "potential_addons",
    "unknowns",
  ],
  properties: {
    project_type: { type: "string" },
    project_summary: { type: "string" },
    scope_items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "description",
          "quantity",
          "quantity_status",
          "unit",
          "confidence",
          "matched_sku",
          "match_confidence",
          "source_text",
        ],
        properties: {
          description: { type: "string" },
          quantity: { type: ["number", "null"] },
          quantity_status: {
            type: "string",
            enum: ["explicit", "derived", "inferred", "unknown"],
          },
          unit: { type: ["string", "null"] },
          confidence: { type: "number" },
          matched_sku: { type: ["string", "null"] },
          match_confidence: { type: "number" },
          source_text: { type: "string" },
        },
      },
    },
    assumptions: { type: "array", items: { type: "string" } },
    exclusions: { type: "array", items: { type: "string" } },
    potential_addons: { type: "array", items: { type: "string" } },
    unknowns: { type: "array", items: { type: "string" } },
  },
} as const;

export interface ExtractOutcome {
  result: ExtractionResult;
  usage: { model: string; input_tokens: number; output_tokens: number; latency_ms: number };
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export async function extractScope(
  notes: string,
  catalog: PricingItem[]
): Promise<ExtractOutcome> {
  // Catalog WITHOUT prices - the model must not see or reason about money.
  const catalogForModel = catalog.map((c) => ({
    sku: c.sku,
    name: c.name,
    unit: c.unit,
    category: c.category,
    description: c.description,
  }));

  const started = Date.now();
  const completion = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content:
          `CATALOG (match SKUs from here only; prices are intentionally omitted):\n` +
          `${JSON.stringify(catalogForModel)}\n\n` +
          `SITE-WALK NOTES:\n${notes}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "scope_extraction", schema: SCHEMA, strict: true },
    },
  });
  const latency_ms = Date.now() - started;

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from model");

  let parsed: ExtractionResult;
  try {
    parsed = JSON.parse(raw) as ExtractionResult;
  } catch {
    throw new Error("Model returned invalid JSON");
  }

  // Defense-in-depth: sanitize the model output before it touches money.
  const validSkus = new Set(catalog.map((c) => c.sku));
  const items: ExtractedItem[] = (parsed.scope_items || []).map((it) => {
    const skuOk = it.matched_sku != null && validSkus.has(it.matched_sku);
    return {
      description: String(it.description ?? "").trim() || "Unspecified item",
      quantity: typeof it.quantity === "number" ? it.quantity : null,
      quantity_status: it.quantity_status ?? "unknown",
      unit: it.unit ?? null,
      confidence: clamp01(it.confidence),
      matched_sku: skuOk ? it.matched_sku : null, // drop hallucinated SKUs
      match_confidence: skuOk ? clamp01(it.match_confidence) : 0,
      source_text: String(it.source_text ?? "").trim(),
    };
  });

  return {
    result: {
      project_type: parsed.project_type ?? "landscape project",
      project_summary: parsed.project_summary ?? "",
      scope_items: items,
      assumptions: parsed.assumptions ?? [],
      exclusions: parsed.exclusions ?? [],
      potential_addons: parsed.potential_addons ?? [],
      unknowns: parsed.unknowns ?? [],
    },
    usage: {
      model: MODEL,
      input_tokens: completion.usage?.prompt_tokens ?? 0,
      output_tokens: completion.usage?.completion_tokens ?? 0,
      latency_ms,
    },
  };
}
