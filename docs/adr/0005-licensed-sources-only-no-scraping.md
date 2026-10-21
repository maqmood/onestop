# ADR-0005: Licensed or official sources only; no scraping

**Status:** Accepted
**Date:** 2026-10-20
**Deciders:** Founder

## Context
The original idea was to scrape auction sites and aggregators to seed a database, then
seek licences later. Scraping breaches those sites' terms; auction photos are copyrighted
and attribution or existing watermarks do not create a licence; live listings do not cover
cars auctioned one to five years ago, which is what the UAE used market needs; scraped data
cannot be migrated into a licensed product; and a scraped company is a worse licensing
partner later.

## Decision
Data enters only through provider adapters backed by a contract, a public API with
published terms (NHTSA), or a vendor trial under its terms. The fact and date of a salvage
auction comes legitimately from NMVTIS junk/salvage/insurance reporting via an approved
reseller. Auction photos are displayed only after a written rights warranty and IP
indemnity from the vendor, gated by `sources.display_allowed`.

## Options considered
- **A. Scrape first, license later.** Rejected for the reasons above.
- **B. Licensed/official only (chosen).** Narrower report in beta; defensible and migratable.
- **C. User- and inspection-partner-supplied photos.** Complementary; later phase.

## Consequences
- Easier: beta can be public; partnership conversations start clean; IP risk is bounded.
- Harder: no photos until a vendor with provable rights is signed; must state this plainly
  in the "sources not checked" panel.
- Revisit: when a vendor provides a rights warranty, or when Copart Middle East or
  Emirates Auction licensing becomes available.
