# ADR-0001: Provenance-first data model

**Status:** Accepted
**Date:** 2026-10-20
**Deciders:** Founder

## Context
Report data will come from several providers whose licence terms differ (official public
domain, licensed reseller, vendor trial, unverified). Sources will be swapped as contracts
are signed. The report must credit sources, must never render data we have no right to
show, and must say which sources were checked, not checked, or errored.

## Decision
Every stored record references a row in `sources` and carries `licence_verified`,
`fetched_at`, `retention_until`, and the provider's `external_ref`. `sources` carries
`kind`, `licence_ref`, `attribution_text`, `display_allowed`, and `allowed_uses`. The report
renderer refuses any record whose source has `display_allowed = false`. Reports store
`sources_checked`, `sources_not_checked`, and `sources_errored` as first-class fields.

## Options considered
- **A. Flat `vehicle_history` table per VIN.** Simplest; loses lineage, makes licence
  gating and swap-outs a rewrite. Rejected.
- **B. Provenance-first (chosen).** Slightly more joins; swap-outs and gating are data changes.
- **C. Store raw provider responses only.** Cheap now, every renderer re-parses; rejected.

## Consequences
- Easier: replacing a trial feed with a licensed one; auditing what a customer saw; honouring
  per-source caching limits; crediting sources accurately.
- Harder: one extra join per record; schema discipline when adding a record type.
- Revisit: when licences allow caching across customers, add cache policy per source.
