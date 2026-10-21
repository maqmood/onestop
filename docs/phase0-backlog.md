# Phase 0 backlog — private alpha

Order matters: each epic depends on the ones above it. Work one task per branch.
Estimates assume one builder with AI assistance; calendar time will be longer.

## E0 — Foundation (2 days)

- [ ] **T0.1 Repo scaffold.** Next.js App Router, TypeScript strict, pnpm, Tailwind,
      ESLint, Prettier, Vitest, GitHub Actions running lint + typecheck + test.
      *Done when:* CI is green on an empty app; `CLAUDE.md`, `docs/adr/`, `.env.example` present.
- [ ] **T0.2 Basic-auth gate.** Whole site behind a single shared credential via middleware.
      *Done when:* unauthenticated requests get 401; credential comes from env.
- [ ] **T0.3 i18n + RTL scaffold.** `next-intl`, `en` catalogue only, `<html dir>` switches on
      locale, one placeholder `ar` catalogue with keys mirrored and English values.
      *Done when:* flipping locale to `ar` renders the layout mirrored with no broken components.

## E1 — Data layer (4 days)

- [ ] **T1.1 Apply `supabase/migrations/0001_init.sql`.** Seed sources.
      *Done when:* migration applies cleanly on a fresh database; RLS enabled on every table.
- [ ] **T1.2 Database access module** (`src/db/`), typed queries, no ORM-specific features
      that are not portable.
- [ ] **T1.3 Retention job.** Deletes `source_records` past `retention_until`, `precheck_log`
      older than 30 days, reports past `expires_at`, and revokes expired share tokens.
      *Done when:* test proves records past their date are gone and others untouched.
- [ ] **T1.4 Deletion request flow.** Email-hash lookup, hard delete of `customers` row,
      `orders.customer_id` set null, share tokens revoked.
      *Done when:* test proves no table contains the email after completion.

## E2 — VIN capture (1.5 weeks)

- [ ] **T2.1 Manual entry.** Uses `src/vin/validate.ts`; shows reasons on failure; NA
      check-digit failure blocks, non-NA shows hint.
- [ ] **T2.2 Barcode scanning** in a web worker (`zxing-wasm`): Code 39 and Data Matrix.
      *Done when:* 10 real VIN plates/door labels decode in ambient light; no image bytes in
      any network request (assert in test with a mocked fetch).
- [ ] **T2.3 VIN-plate OCR** in a web worker (`tesseract.js`): crop guide, grayscale and
      threshold preprocessing, VIN regex, `fixCommonOcrConfusions`, then validator.
      *Done when:* measured success rate on 20 real plates is recorded in `docs/ocr-accuracy.md`.
- [ ] **T2.4 Mulkiya OCR (conditional).** Same pipeline with a card crop guide; extracts
      only the chassis number; image discarded in-memory.
      *Done when:* success rate on 20 real cards recorded; remove the feature if below the
      rate agreed in `docs/ocr-accuracy.md`.
- [ ] **T2.5 Error-monitoring guard.** If an error reporter is used, prove no canvas,
      image, or form data is captured.

## E3 — Provider adapters (1.5 weeks)

- [ ] **T3.1 Adapter contract** per `src/providers/types.ts`; registry; cost and latency
      recorded to `provider_calls`.
- [ ] **T3.2 NHTSA vPIC decode adapter** (real API).
- [ ] **T3.3 NHTSA recalls adapter** (real API), labelled "US recalls only".
- [ ] **T3.4 NMVTIS reseller adapter** against sandbox credentials; normalises title,
      brands, odometer, and junk/salvage/insurance events (reporting entity, date,
      disposition, export flag). Existence-check endpoint if the reseller offers one.
- [ ] **T3.5 Auction adapter** against a vendor trial, or a stub returning "not checked"
      when `AUCTION_VENDOR_ENABLED=false`. Photos only render when the source row has
      `display_allowed = true`.
      *Done when:* every adapter has recorded fixtures for ok, no-records, and error paths.

## E4 — Pre-check (4 days)

- [ ] **T4.1 `/api/precheck`.** Normalise VIN, cache per `allowed_uses.cache_days`, run
      decode + existence check, log hashed VIN and IP with result class.
- [ ] **T4.2 Rate limiting** by hashed IP and a bot challenge that stores no personal data.
- [ ] **T4.3 Pre-check UI copy.** Factual categories and counts only; no alarm language;
      price (or "free during beta") shown before any email is requested.

## E5 — Report engine (1 week)

- [ ] **T5.1 Report builder.** Runs adapters, assembles `sources_checked / not_checked /
      errored`, persists report and `report_records`.
- [ ] **T5.2 Renderer** with locale and direction support; sections: vehicle, title and
      brands, odometer, salvage/insurance events, auction (if allowed), recalls, sources
      panel with UAE links (MOI, EVG, RTA certificate), NMVTIS disclaimer slot, attribution
      lines from `sources.attribution_text`.
- [ ] **T5.3 Print stylesheet** that produces a clean PDF via browser print.
- [ ] **T5.4 Share link.** Random token, SHA-256 stored, 90-day expiry, revocable, report
      contains no personal data.
- [ ] **T5.5 Copy review.** Every "no record" state reads as "no record found in the
      sources checked", in both catalogues.

## E6 — Compliance-in-code (4 days)

- [ ] **T6.1 Email-only identity** with magic links via `src/auth/`.
- [ ] **T6.2 Consent logging** at email capture: document version, type, IP hash.
- [ ] **T6.3 Transactional email** templates; marketing opt-in separate and off by default.
- [ ] **T6.4 Security baseline.** Secrets scan in CI, dependency audit, headers (CSP,
      HSTS), admin behind MFA-capable auth.

## E7 — Payments behind a flag (3 days)

- [ ] **T7.1 Order model and checkout flow** with gateway-hosted page in test mode.
- [ ] **T7.2 Signed webhook** with idempotency on gateway event id.
- [ ] **T7.3 Auto-refund** when report generation fails after retries.
- [ ] **T7.4 Invoice number sequence** and invoice template with VAT line and TRN
      placeholder (Arabic version added in Phase 1).

## E8 — Admin and test set (1 week)

- [ ] **T8.1 Minimal admin:** orders, reports, sources (toggle `display_allowed`), deletion
      requests, cost per report.
- [ ] **T8.2 Test VIN set:** 30–50 real VINs including known salvage cars and the known
      insurer-repaired car; expected outcomes recorded in `docs/test-vins.md`.
- [ ] **T8.3 Funnel counters:** pre-checks, US-origin share, reports, OCR success, errors.

## Exit criteria for Phase 0

- All epics done; CI green; `docs/ocr-accuracy.md` and `docs/test-vins.md` filled in.
- A report for a known salvage car shows the NMVTIS salvage/insurance event with reporting
  entity and date, with no scraped content anywhere in the codebase or database.
- Phase 1 checklist (entity, licence, contracts, legal docs, Arabic) started.
