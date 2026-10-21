# OneStop — UAE vehicle history reports (working title)

Read this before changing anything. It encodes product, legal and engineering decisions
that are not up for silent reinterpretation. To change a rule, add an ADR in `docs/adr/`
and update this file in the same PR.

## What this is

Mobile-first PWA. A user enters a VIN (manual entry, barcode, or on-device OCR) and gets:

1. A free pre-check: decoded vehicle details and whether US records exist. Never charge
   when there is no US history.
2. A report built only from official or licensed US sources (NHTSA decode and recalls,
   NMVTIS via an approved reseller, auction records only once redistribution rights are
   verified in writing), plus a "sources checked / not checked" panel that names the UAE
   sources we do not yet cover and links to the free MOI/EVG checks and the RTA certificate.

Phase 0 is a PRIVATE alpha: basic-auth gate, no public access, no payments, no real
customer data. Test emails only.

## Non-negotiables (compliance by design)

1. **No scraping.** Data enters only through provider adapters in `src/providers/` backed by
   a contract, a public API with published terms, or a vendor trial. Do not write crawlers
   against Copart, IAAI, aggregators, or UAE government sites. See ADR-0005.
2. **Provenance on every record.** `sources` and `source_records` carry source, licence
   status, attribution text, fetch time and retention date. Nothing renders unless
   `sources.display_allowed = true`. See ADR-0001.
3. **Images never leave the device.** Barcode and OCR run in web workers in the browser.
   No image bytes in logs, error reports, analytics, or network requests. The server only
   ever receives a VIN string. See ADR-0002.
4. **Personal data minimisation.** Email is the only identity field. No names, phone
   numbers, dates of birth, passwords. Logs store hashes of VIN and IP, never raw values.
5. **No third-party SDKs or cookies** beyond strictly necessary (session, CSRF). No analytics
   scripts in Phase 0; server-side counters only. See ADR-0004.
6. **Report copy never implies "no record found" means "no accident".** Every report shows
   sources checked, not checked, and errored, and carries the NMVTIS disclaimer slot.
7. **Payments only via gateway-hosted pages.** We never see card data. Feature-flagged off
   in Phase 0.
8. **i18n and RTL scaffolding from day one.** English strings now, Arabic later. No
   hard-coded UI strings; every string goes through the message catalogue.
9. **Portable Postgres only.** SQL migrations, no vendor-specific features except RLS.
   Storage behind an S3-compatible interface in `src/storage/`. Auth behind `src/auth/`.
   Hosting region is undecided; nothing may assume a region. See ADR-0003.
10. **Secrets via environment variables only.** Never committed. `.env.example` documents
    every variable with a one-line purpose.

## Stack (Phase 0 defaults; override via ADR)

- Next.js (App Router), TypeScript `strict`, pnpm, Node 22 LTS
- Tailwind for styling; `next-intl` for i18n with `dir="rtl"` support
- Postgres (Supabase-hosted in Phase 0) with plain SQL migrations in `supabase/migrations/`
- `zxing-wasm` for barcode, `tesseract.js` for OCR, both in web workers
- Vitest for tests; ESLint + Prettier; GitHub Actions for lint, typecheck, test
- Transactional email provider with a DPA (Resend or Postmark); marketing mail separate
- Stripe test mode behind `PAYMENTS_ENABLED=false` until the entity exists

## Code conventions

- Folders by domain, not by file type: `src/vin/`, `src/providers/`, `src/report/`,
  `src/checkout/`, `src/compliance/`, `src/auth/`, `src/storage/`.
- Every module starts with a header comment: purpose, inputs, outputs, invariants, and any
  licence or privacy note about the data it handles.
- JSDoc on every exported function. Comments explain *why*; the code explains *what*.
- Functions do one thing. Files under ~300 lines; split by responsibility when they grow.
- Errors are typed results, not thrown strings. Provider failures become
  `sources_errored` entries, never silent omissions.
- Money in integer minor units (fils). Times are `timestamptz` in UTC.
- Strings shown to users are keys in the message catalogue, never literals in components.

## Workflow

- One task per branch, one PR per task, under ~400 changed lines. Conventional commits.
- Every PR description states: what changed, why, which ADR or backlog item it serves,
  and which non-negotiables it touches.
- `pnpm lint && pnpm typecheck && pnpm test` must pass before a PR is opened.
- AI-generated code is reviewed against this file. If a change needs a rule bent, stop and
  write the ADR first.

## Definition of done (per task)

- [ ] Acceptance criteria in `docs/phase0-backlog.md` met
- [ ] Tests added for new logic; fixtures recorded for provider calls
- [ ] Header comment and JSDoc present
- [ ] No new personal data fields, SDKs, cookies, or hard-coded strings
- [ ] Message catalogue updated for any new UI text
- [ ] `.env.example` updated if a variable was added

## Tests that must always exist

- VIN normalisation, structural validation, and check-digit computation
- OCR post-processing (character confusion fixes) and barcode payload parsing
- Each provider adapter against recorded fixtures, including error and no-records cases
- Webhook signature verification and idempotency
- Retention and deletion jobs (records past `retention_until` are gone; deleted customers
  leave no email anywhere)

## Compliance checklist for reviewers

- Does this change collect, log, or transmit anything that could identify a person? If yes,
  it needs a privacy note in the PR and probably a different design.
- Does any rendered content come from a source with `display_allowed = false`?
- Does any copy suggest completeness we cannot prove?
- Does any image or canvas content reach a network call or an error reporter?
