/**
 * src/providers/types.ts
 *
 * Purpose:   The contract every data provider adapter implements, so the report builder
 *            treats NHTSA, the NMVTIS reseller and any auction vendor identically.
 * Inputs:    A validated VIN (see src/vin/validate.ts).
 * Outputs:   Normalised records with provenance, or a typed failure. Adapters never throw.
 * Invariants:
 *   - Adapters only call endpoints we are contractually or publicly permitted to use
 *     (ADR-0005). No crawling, no HTML parsing of third-party sites.
 *   - Payloads must not contain personal data. Provider responses that include names,
 *     addresses or document images must be stripped in the adapter before returning.
 *   - Every call reports cost and latency so unit economics are measurable from day one.
 */

/** Mirrors the `record_type` enum in supabase/migrations/0001_init.sql. */
export type RecordType =
  | 'decode'
  | 'recall'
  | 'title'
  | 'brand'
  | 'odometer'
  | 'jsi_event'
  | 'theft'
  | 'lien'
  | 'auction_sale'
  | 'auction_photo'
  | 'other';

/** One normalised fact about a vehicle, ready to be stored as a `source_records` row. */
export interface NormalisedRecord {
  recordType: RecordType;
  /** Provider-agnostic shape per record type; documented in src/providers/schemas.ts. */
  payload: Record<string, unknown>;
  /** Provider's own identifier or receipt, kept for disputes. */
  externalRef?: string;
  /** Overrides the source default; used when a licence sets a per-record cache limit. */
  retentionUntil?: Date;
}

export type ProviderStatus = 'ok' | 'no_records' | 'error';

export type ProviderErrorClass =
  | 'auth' // credentials rejected
  | 'quota' // rate or budget limit hit
  | 'timeout'
  | 'upstream' // provider returned 5xx or malformed data
  | 'unsupported'; // provider cannot answer for this VIN (e.g. non-NA VIN)

export interface ProviderResult {
  /** Must match a `sources.key` row. */
  sourceKey: string;
  status: ProviderStatus;
  records: NormalisedRecord[];
  /** Set only when status is 'error'. */
  error?: { class: ProviderErrorClass; message: string };
  /** What this call cost us in fils, if known. 0 for free public APIs. */
  costMinor: number;
  latencyMs: number;
  fetchedAt: Date;
}

export interface ProviderAdapter {
  /** Must match a `sources.key` row. */
  readonly sourceKey: string;
  /** Record types this adapter can return; used to build the "sources checked" panel. */
  readonly provides: readonly RecordType[];
  /**
   * Cheap existence check for the free pre-check, if the provider offers one.
   * Returns null when unsupported, in which case the pre-check must not claim to know.
   */
  exists?(vin: string): Promise<{ hasRecords: boolean; categories: RecordType[] } | null>;
  /** Full fetch for a paid or beta report. Never throws; errors come back in the result. */
  fetch(vin: string): Promise<ProviderResult>;
}

/**
 * The report builder consumes a registry rather than importing adapters directly, so a
 * vendor can be disabled by configuration (e.g. AUCTION_VENDOR_ENABLED=false) and shows
 * up in `sources_not_checked` with a reason instead of silently disappearing.
 */
export interface ProviderRegistryEntry {
  adapter: ProviderAdapter;
  enabled: boolean;
  /** Reason shown in the sources panel when disabled, as a message-catalogue key. */
  disabledReasonKey?: string;
}
