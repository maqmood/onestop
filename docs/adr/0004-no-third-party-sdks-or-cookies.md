# ADR-0004: No third-party SDKs, analytics scripts, or non-essential cookies in v1

**Status:** Accepted
**Date:** 2026-10-20
**Deciders:** Founder

## Context
Each SDK is a processor relationship under PDPL, a potential personal-data leak (images,
VINs, emails), and the trigger for a cookie consent banner. Phase 0 and beta do not need
behavioural analytics; they need funnel counts.

## Decision
No analytics, advertising, session-replay, or chat SDKs. Server-side counters only
(pre-checks, reports, OCR success, US-origin share). Error monitoring, if used, runs with
PII scrubbing and image capture disabled. Fonts are self-hosted under OFL licences. Only
strictly necessary cookies, so no consent banner is required; a short cookie notice page
suffices.

## Consequences
- Easier: privacy policy, SDK audit, cookie policy, page performance.
- Harder: product analytics are coarser; add a privacy-respecting tool later via ADR.
- Revisit: before any paid acquisition campaign.
