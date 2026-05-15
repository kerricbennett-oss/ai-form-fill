# Form-Fill Phase 2 — Build Plan

**Project:** AI Form Fill  
**Date:** 2026-05-15  
**Goal:** Professional-grade export, email delivery, and mobile-ready UI for business/executive testers

---

## Phase 1 — Completed ✓

| Feature | Status |
|---|---|
| Voice hands-free loop (auto-restart mic after AI speaks) | ✓ Done |
| 3.5s silence timer before auto-send | ✓ Done |
| Skip voice command ("skip", "next", "I don't know") | ✓ Done |
| Active field highlight (green row tracks current question) | ✓ Done |
| PDF export — two-page (form image + filled summary) | ✓ Done |
| Field fill reliability (list accumulation, Yes/No, boolean fix) | ✓ Done |
| Inline field editing | ✓ Done |
| Stop button to pause conversation | ✓ Done |

---

## Phase 2 — Build Plan

### Step 1: Professional Form Export with Overlay

**What:** Filled answers appear directly on the original form — typed into the right fields, exactly where they belong. Export as PDF or PNG.

**How it works:**
1. Update `pages/api/scan.js` — ask Claude to return bounding box coordinates (`x`, `y`, `w`, `h` as % of image dimensions) alongside each field label/type
2. Update `pages/index.js` — store coordinates with each field in state
3. Replace `exportForm()` with a Canvas renderer:
   - Draw original form image onto an HTML Canvas
   - Loop through filled fields, place each value as text at its coordinates
   - Render clean typography (dark ink color, appropriate font size)
4. Export options: **PDF** (via jspdf `addImage` from canvas) or **PNG** (canvas `toDataURL`)
5. PDF uploads: use `pdfjs-dist` to render PDF pages to canvas first, then overlay text

**Files to change:** `scan.js`, `index.js`  
**New dependencies:** `pdfjs-dist` (for PDF uploads)  
**Effort:** Medium — scan prompt change is low-risk; canvas overlay is straightforward

---

### Step 2: Email Completed Form

**What:** When the form is complete, user can email the filled PDF directly from the app.

**How it works:**
1. Add **Email** button next to Export in the bottom bar (only active when fields are filled)
2. Clicking Email opens a small modal — user enters their email address
3. Frontend generates the completed PDF (same canvas overlay from Step 1)
4. Sends base64 PDF to `/api/email` backend route
5. Backend uses **Resend** (resend.com — free tier, simple REST API) to send email with PDF attached
6. User gets email with subject "Your Completed Form" + PDF attachment

**Files to change:** `index.js` (button + modal)  
**New files:** `pages/api/email.js`  
**New dependencies:** `resend`  
**New env var:** `RESEND_API_KEY` in `.env.local` (user fills in manually)  
**Effort:** Low-Medium — Resend API is very simple

---

### Step 3: Mobile-Responsive Layout

**What:** Full app works on phones and tablets — same voice, same conversation, same export.

**How it works:**
1. Replace fixed `gridTemplateColumns: '1fr 1fr'` with responsive layout:
   - Desktop (≥768px): side-by-side two-column grid (current behavior)
   - Mobile (<768px): single column, panels stack vertically
2. Add CSS media query in the `<style>` block at bottom of `index.js`
3. Ensure touch targets are large enough (buttons already 36px — meets minimum)
4. Fields panel: full-width on mobile, generous scroll height
5. Chat panel: full-width, taller on mobile
6. Voice: Web Speech API already works on Chrome for Android and Safari iOS 14.5+

**Files to change:** `index.js` (styles + layout)  
**New dependencies:** None  
**Effort:** Low — CSS only, no logic changes

---

## Build Order

```
Step 1 (Export Overlay)  →  Step 2 (Email)  →  Step 3 (Mobile)
      ↑ most impactful           ↑ depends          ↑ polish
        for testers               on Step 1
```

Step 2 depends on Step 1 (needs the canvas PDF). Step 3 is independent and can be done anytime.

---

## Environment Setup for Phase 2

Add to `.env.local` (never commit):
```
ANTHROPIC_API_KEY=sk-ant-...        # already set
RESEND_API_KEY=re_...               # add before Step 2
```

Get a free Resend API key at resend.com — no credit card required for testing.

---

## Notes

- Target users: business owners, executives — export quality must be professional
- Final deployment: Vercel (already planned)
- Both desktop and mobile must work end-to-end before shipping
- PDF upload support for overlay requires `pdfjs-dist` — adds ~500kb to bundle, acceptable
