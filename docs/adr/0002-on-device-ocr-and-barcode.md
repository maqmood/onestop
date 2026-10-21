# ADR-0002: Barcode and OCR run on the device; images never leave the browser

**Status:** Accepted
**Date:** 2026-10-20
**Deciders:** Founder

## Context
VIN capture from a VIN plate photo or a registration card (Mulkiya) is convenient, but
registration cards carry the owner's personal data. Sending images to a server or a cloud
OCR API creates personal-data processing and a cross-border transfer for a feature whose
fallback (typing 17 characters) is adequate.

## Decision
Barcode decoding (`zxing-wasm`) and OCR (`tesseract.js`) run in web workers in the browser.
The server receives only the extracted VIN string. Image bytes must never reach network
calls, logs, analytics, or error reporters. Mulkiya OCR ships only if measured accuracy on
real cards is acceptable; otherwise it is removed, not moved server-side.

## Options considered
- **A. Cloud OCR (Google Vision, Textract).** Best accuracy; creates personal-data and
  transfer obligations for a convenience feature. Rejected for Phase 0.
- **B. Server-side open-source OCR with transient memory.** Still a transfer; harder to
  prove non-persistence. Rejected.
- **C. On-device (chosen).** Lower accuracy, zero server-side exposure.

## Consequences
- Easier: privacy policy statement ("images never leave your device") is literally true.
- Harder: accuracy and performance on low-end phones; needs a measured accuracy gate.
- Revisit: if a Mulkiya QR/barcode standard carrying the chassis number is confirmed,
  prefer it over OCR.
