# Phase 2 — Geometry Reliability for Flat PDFs & Image Forms

**Date:** 2026-05-16  
**Status:** Approved  
**Validated by:** Codex review (aligned with Approach A)

---

## Problem

For flat PDFs and image forms, Claude currently guesses x/y/w/h coordinates from the form image. These guesses are often inaccurate — text drifts outside field boundaries. Field workers on mobile cannot correct this.

The root fix: detect actual field box geometry from the image pixels. Let Claude label boxes, not invent coordinates.

---

## Architecture Principle

> AI labels fields. Deterministic code detects geometry. Claude never invents final x/y/w/h.

- **Fillable PDFs:** pdf-lib path — untouched, already exact.
- **Flat PDFs / image forms:** detect boxes client-side, Claude maps labels to detected boxes.

---

## Data Flow

```
Upload form
  ↓
Render pages to canvas (pdfjs for PDF, Image for JPG/PNG)
  ↓
lib/detectBoxes.js — scan canvas pixels for rectangles
  → returns [{x, y, w, h, confidence}] as page percentages
  ↓
/api/scan — send form image + detected boxes to Claude
  Claude task: match each box to a label and field type only
  → returns [{id, label, type, x, y, w, h, confidence}]
  ↓
Store as fields[] in state (same shape as today)
  ↓
User fills via chat (unchanged)
  ↓
Export → renderCanvases() → overlayCanvas() (unchanged)
  ↓
Preview modal:
  - Low-confidence fields → amber warning
  - Desktop: drag handles to reposition boxes
  - Mobile: warning only, no drag UI
  ↓
Download PDF
```

**Fallback:** If detection finds zero boxes, fall back to Claude coordinate guessing (current behavior). Null-coord fields fall to summary section (already built).

---

## Components

### New: `lib/detectBoxes.js`

Pure-JS rectangle detector. No external dependencies. Runs on canvas `ImageData`.

**Input:** `HTMLCanvasElement`, `pageNumber`  
**Output:** `[{x, y, w, h, confidence, page}]` — percentages of page dimensions

**Algorithm — three passes:**

1. **Edge map** — convert canvas to grayscale, find sharp pixel transitions (dark line on light background). Detects horizontal and vertical line segments.

2. **Rectangle assembly** — find four-sided closed shapes from intersecting line segments. Valid candidates: wider than tall, min width ~3% of page, min height ~0.5% of page (filters noise and text runs).

3. **Confidence scoring** — score each candidate on:
   - Completeness of four sides (strong lines = higher score)
   - Interior whitespace (field boxes are blank inside)
   - Non-overlap with other candidates (deduplication)
   - Score range: 0.0–1.0. Threshold for "low confidence" warning: < 0.5

**Expected accuracy:**
- Clean digital flat PDFs: 85–95%
- Scanned paper forms: 50–70%

---

### Modified: `/api/scan.js`

New scan mode when `detectedBoxes` array is passed in the request body.

**Label-mapping mode (new):**
```
Claude task: "Here are the detected field boxes at these positions.
Match each box to a human-readable label and field type.
Do not invent coordinates — use the positions provided."
```

Returns: `[{id, label, type, x, y, w, h, confidence, page}]`

**Existing modes (unchanged):**
- Fillable PDF label-mapping (fillableFieldNames passed)
- Standard coordinate-guessing (no boxes, no fillableFieldNames)

---

### Modified: `pages/index.js`

**After render, before scan:**
- Call `detectBoxes(canvas, pageNum)` for each rendered page
- If boxes found: pass to `/api/scan` as `detectedBoxes`
- If no boxes: scan without boxes (falls back to Claude guessing)

**Preview modal additions:**
- Low-confidence fields (confidence < 0.5): amber warning listing field labels (same pattern as null-coord warning today)
- Desktop: drag handles on overlay boxes — `mousedown`/`mousemove`/`mouseup` to reposition
- Mobile: no drag UI — warning only

**State additions:**
```js
// No new top-level state needed — confidence stored on field objects
// Drag state is local to preview modal (useRef)
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Detection finds 0 boxes | Fall back to Claude coord guessing |
| Claude can't match all box labels | Unmatched fields get x:null → summary fallback |
| Low-confidence box (< 0.5) | Overlaid but amber warning in preview |
| Fillable PDF uploaded | Detection never runs — pdf-lib path |
| Multi-page form | Detection runs per-page, boxes carry `page` number |
| Mobile user + low-confidence | Warning shown, no drag option |
| Detection crashes | Caught silently, falls back to Claude guessing |

No new hard-failure states. All errors degrade to existing patterns.

---

## Mobile Strategy

Detection and preview run fully on mobile. Drag-to-correct is desktop-only.

For field workers on mobile:
- Clean digital flat PDFs (most mailed forms): 85–95% accuracy → most users never need correction
- Noisy scans: lower accuracy, amber warnings shown, summary fallback for missed fields
- No dependency on drag correction — the detection quality is the mobile solution

---

## Out of Scope (Future)

- Tesseract.js / OpenCV — only if lightweight detector fails on enough real forms to justify the 4–7MB load cost
- Touch drag on mobile — add if users request it after launch
- Template caching — save corrected geometry for reuse (Phase 3D)
- HIPAA compliance — required before healthcare clients (Phase 3+)

---

## Files Changed

| File | Change |
|---|---|
| `lib/detectBoxes.js` | New |
| `pages/api/scan.js` | Add label-mapping mode with detectedBoxes |
| `pages/index.js` | Call detector, pass boxes to scan, drag UI, confidence warnings |
| `lib/pdfFields.js` | No change |
