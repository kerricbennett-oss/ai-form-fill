# AI Form Fill — Build Plan

**Product:** AI Form Fill  
**Owner:** 4HG Tech  
**Last updated:** 2026-05-16  
**Stack:** Next.js, React 18, Claude claude-sonnet-4-6, Resend, Vercel

---

## Product Vision

A SaaS tool that lets business owners and executives upload any form, fill it out via voice or chat with AI, and export or email a completed PDF — without needing technical knowledge or an API key.

---

## Current State (as of PR #4)

### What works
- Upload image or PDF forms
- Claude scans and identifies all fillable fields
- Voice/chat interface fills fields via AI conversation
- Export to PDF with text overlay
- Email completed PDF via Resend
- Mobile responsive layout

### Known issues
- **Export accuracy**: Claude guesses pixel coordinates from the image — text drifts outside field boundaries on complex forms
- **Checkboxes**: Renders "Yes"/"No" text instead of a checkmark
- **No pre-export verification**: User cannot see placement before committing to export
- **API routes unprotected**: No auth or rate limiting (blocks public launch)

---

## Architecture Principle

> **AI identifies fields. Deterministic code controls placement. Per-field confidence gates overlay.**

Claude should never invent pixel coordinates. It should label fields semantically ("First Name", "Date of Birth"). Code determines exact placement from real geometry.

---

## MVP Phase 1 — Export Reliability
**Goal:** Fix the export so demos are credible. Ship before showing to users.  
**Estimated effort:** 3–5 days

### 1A — Native fillable PDFs via pdf-lib
- On upload, detect whether the PDF has embedded AcroForm fields
- If yes: read actual field names and positions from the PDF (100% accurate, no guessing)
- Claude matches semantic labels to field names and provides values
- `pdf-lib` writes values directly into the form — no canvas overlay needed
- Output: a properly filled PDF with text in the exact right fields

**Why this matters:** Most business forms distributed digitally are fillable PDFs. This case becomes demo-perfect.

### 1B — Pre-export overlay preview (images / flat PDFs)
- Before export, render the form image with field overlays visible in the UI
- User sees exactly where text will land
- User clicks "Looks good, export" or catches drift and corrects manually
- Per-field confidence check: if coordinates are null or out of bounds, skip overlay for that field and include it in a summary section at the bottom of the PDF instead

**Why this matters:** Turns a silent failure into a user-controlled decision. Honest and trustworthy UX.

### 1C — Checkbox rendering fix
- For `type: "checkbox"` fields with value matching yes/true/x: draw ✓ centered in field box
- For "no" / unchecked: leave box empty (do not write text)

### Deliverable
- Fillable PDFs: text lands perfectly every time
- Image/flat PDF forms: user verifies before export, no surprise drift
- No more "Yes"/"No" in checkbox fields

---

## Phase 2 — Geometry Reliability for Images
**Goal:** Eliminate coordinate guessing for scanned/image forms entirely.  
**Estimated effort:** 2–3 weeks

### 2A — Layout detection for images
- On image upload, run box/rectangle detection to find actual field boundaries in image space
- Normalize detected boxes to percentage coordinates
- Claude's scan maps semantic labels to detected boxes (not coordinates — just "which box is First Name")
- Overlay uses detected geometry, not Claude's guesses

### 2B — OCR-assisted mapping
- Use Tesseract.js to detect text labels in image space
- Match detected labels to nearby detected boxes
- Gives Claude-to-box mapping without Claude inventing coordinates

### 2C — Manual correction UI
- After preview, user can drag misaligned field boxes to correct position
- Correction saved for that session
- Future: save corrections as a template for that form type

### Deliverable
- Image forms reach near-100% placement accuracy
- Manual drag correction as safety net for edge cases

---

## Phase 3 — Production & Scale
**Goal:** Auth, billing, and deployment for public launch.  
**Estimated effort:** 3–4 weeks

### 3A — Authentication
- Add Clerk or NextAuth to protect all routes
- Session token validated in `/api/scan`, `/api/chat`, `/api/email`
- Required before making the app URL public

### 3B — Rate limiting
- Per-user request limits to protect the Anthropic API key
- Abuse detection on scan and chat routes

### 3C — SaaS billing
- Subscription tiers (e.g., free trial → paid plan)
- 4HG Tech holds the Anthropic API key; users pay subscription
- Stripe or similar

### 3D — Template caching
- Once a form's geometry is solved, cache it
- Returning users filling the same form type skip the scan step
- Saves API credits, speeds up UX

### 3E — Resend production sender
- Add verified domain in Resend dashboard
- Set `RESEND_FROM_EMAIL=AI Form Fill <forms@yourdomain.com>` in Vercel env
- Enables sending to any email, not just Resend account owner

### 3F — pdfjs-dist worker bundling
- Currently loads worker from unpkg CDN on every export
- Bundle locally for production reliability and speed

### Deliverable
- App is public, authenticated, billed, and deployed on Vercel

---

## Tech Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| AI model | claude-sonnet-4-6 | Best vision + instruction following for form scan |
| PDF filling (fillable) | pdf-lib | Reads/writes actual AcroForm fields, 100% accurate |
| PDF rendering (flat) | pdfjs-dist | Renders PDF pages to canvas for overlay |
| PDF generation | jsPDF | Assembles multi-page canvas output into PDF |
| Email | Resend | Simple SDK, generous free tier |
| Deployment | Vercel | Zero-config Next.js hosting |
| Auth (planned) | Clerk or NextAuth | TBD at Phase 3 |
| OCR (Phase 2) | Tesseract.js | Browser-side, no server needed |

---

## Open Questions

- Auth provider: Clerk vs NextAuth — decide at Phase 3 kickoff
- Billing: Stripe tiers — define at Phase 3 kickoff
- Template storage: local browser vs cloud DB — decide at Phase 2 completion
- pdfjs-dist worker: bundle locally vs stay on CDN through Phase 1/2

---

## Key Constraints

- `.env.local` must never be committed (contains ANTHROPIC_API_KEY, RESEND_API_KEY)
- API routes must be protected before public Vercel URL is shared
- During Resend testing, emails only deliver to kerric.bennett@gmail.com
