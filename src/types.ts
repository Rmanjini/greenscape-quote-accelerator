// Shared types. DB row shapes + the structured shape the LLM must return.

export type ProposalStatus =
  | "DRAFT"
  | "AI_GENERATED"
  | "NEEDS_REVIEW"
  | "READY_FOR_APPROVAL"
  | "APPROVED"
  | "SENT"
  | "FAILED";

export type QuantityStatus = "explicit" | "derived" | "inferred" | "unknown";

export interface PricingItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  unit_price: number;
  active: boolean;
}

// ---- What the LLM returns (scope extraction + SKU match) ------------------
// It proposes a SKU + quantity. It NEVER returns money. The app prices it.
export interface ExtractedItem {
  description: string;
  quantity: number | null;
  quantity_status: QuantityStatus;
  unit: string | null;
  confidence: number; // scope-extraction confidence 0..1
  matched_sku: string | null; // must be a real SKU from the supplied catalog
  match_confidence: number; // 0..1; 0 if no confident match
  source_text: string; // snippet of the notes this came from
}

export interface ExtractionResult {
  project_type: string;
  project_summary: string;
  scope_items: ExtractedItem[];
  assumptions: string[];
  exclusions: string[];
  potential_addons: string[];
  unknowns: string[];
}

export interface ProposalItem {
  id: string;
  proposal_id: string;
  pricing_item_id: string | null;
  description: string;
  quantity: number | null;
  quantity_status: QuantityStatus;
  unit: string | null;
  unit_price: number | null;
  line_total: number | null;
  confidence: number | null;
  match_confidence: number | null;
  source_text: string | null;
  needs_review: boolean;
  review_reason: string | null;
}

export interface Proposal {
  id: string;
  contact_id: string | null;
  project_name: string | null;
  address: string | null;
  site_walk_notes: string;
  status: ProposalStatus;
  project_type: string | null;
  ai_summary: string | null;
  assumptions: string[];
  exclusions: string[];
  potential_addons: string[];
  unknowns: string[];
  needs_review: boolean;
  review_reasons: string[];
  subtotal: number;
  discount: number;
  total: number;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  telegram_message_id: string | null;
  ghl_message_id: string | null;
  created_at: string;
  updated_at: string;
}
