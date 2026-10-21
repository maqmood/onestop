# ADR-0003: Portable Postgres; auth and storage behind interfaces; hosting region deferred

**Status:** Accepted
**Date:** 2026-10-20
**Deciders:** Founder (region decision pending lawyer input)

## Context
Supabase is the fastest start but, as far as we could verify, has no UAE region. Vercel has
a Dubai region (dxb1) with availability incidents in 2026. PDPL has no general localisation
rule today, but cross-border transfers need a lawful basis and the executive regulations
are still unissued. The launch region should be chosen with the lawyer, not forced by the
database vendor.

## Decision
Use Supabase-hosted Postgres in Phase 0 (no real user data) with plain SQL migrations and
only portable Postgres features (RLS included). Auth is accessed through `src/auth/`
(magic links) and object storage through `src/storage/` (S3-compatible), so either can be
replaced without touching product code. Vercel function region is configurable with a
fallback. Migration to AWS RDS (me-central-1) or Azure Database for PostgreSQL (UAE North)
is a dump/restore and a config change.

## Options considered
- **A. Supabase EU (Frankfurt) for launch.** Fastest; needs DPA and transfer language.
- **B. AWS RDS me-central-1 + Vercel dxb1.** In-country; self-managed auth/storage.
- **C. Self-hosted Supabase in AWS UAE.** In-country, highest ops burden.
- **Chosen now:** A for Phase 0 with portability; A vs B decided in Phase 1.

## Consequences
- Easier: region move later; no vendor lock-in on auth or storage.
- Harder: cannot use Supabase Edge Functions, Realtime, or storage-specific APIs directly.
- Revisit: when PDPL executive regulations are issued (six-month compliance window).
