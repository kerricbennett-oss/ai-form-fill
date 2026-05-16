# Phase 2 — Geometry Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Claude's coordinate guessing for flat PDFs and image forms with client-side rectangle detection, so field placement is accurate without user intervention.

**Architecture:** On scan, render the form to canvas, detect field rectangles via pure-JS pixel analysis, pass detected boxes to Claude. Claude maps labels to detected boxes — coordinates come from the image, not from Claude. The export preview becomes interactive (drag-to-correct on desktop). Fillable PDFs are untouched.

**Tech Stack:** Next.js Pages Router, React 18, pdfjs-dist (already in use), pdf-lib (already in use), jsPDF (already in use), no new dependencies.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `lib/detectBoxes.js` | **Create** | Pure-JS rectangle detector. Input: canvas. Output: `[{x,y,w,h,confidence,page}]` as percentages. |
| `pages/api/scan.js` | **Modify** | Add detected-boxes label-mapping mode (third prompt branch). |
| `pages/index.js` | **Modify** | `renderPageCanvases()` helper; refactor `renderCanvases()`; add `renderRawPages()`, `detectFormBoxes()`; detection in `scanForm()`; `rawPageUrls` state; interactive preview modal with drag. |

---

## Task 1: Create `lib/detectBoxes.js`

**Files:**
- Create: `lib/detectBoxes.js`

- [ ] **Step 1: Create the file with the full detector**

```js
/**
 * Detect form field rectangles from a rendered canvas.
 * Returns boxes as page-percentage coordinates with confidence scores.
 * @param {HTMLCanvasElement} canvas
 * @param {number} page - 1-based page number
 * @returns {{x:number,y:number,w:number,h:number,confidence:number,page:number}[]}
 */
export function detectBoxes(canvas, page = 1) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const { data } = ctx.getImageData(0, 0, width, height)

  const gray = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    gray[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2])
  }

  const DARK = 128
  const MIN_W = width * 0.03
  const MIN_H = height * 0.005
  const MAX_H = height * 0.15

  // Horizontal line segments
  const hLines = []
  for (let y = 0; y < height; y++) {
    let start = -1
    for (let x = 0; x <= width; x++) {
      const dark = x < width && gray[y * width + x] < DARK
      if (dark && start === -1) { start = x }
      else if (!dark && start !== -1) {
        if (x - start >= MIN_W) hLines.push({ y, x1: start, x2: x - 1 })
        start = -1
      }
    }
  }

  // Vertical line segments
  const vLines = []
  for (let x = 0; x < width; x++) {
    let start = -1
    for (let y = 0; y <= height; y++) {
      const dark = y < height && gray[y * width + x] < DARK
      if (dark && start === -1) { start = y }
      else if (!dark && start !== -1) {
        if (y - start >= MIN_H) vLines.push({ x, y1: start, y2: y - 1 })
        start = -1
      }
    }
  }

  const mergedH = mergeLines(hLines, 'y', 3)
  const mergedV = mergeLines(vLines, 'x', 3)
  const SNAP = width * 0.01

  const candidates = []
  for (let i = 0; i < mergedH.length; i++) {
    for (let j = i + 1; j < mergedH.length; j++) {
      const top = mergedH[i], bot = mergedH[j]
      const boxH = bot.y - top.y
      if (boxH < MIN_H || boxH > MAX_H) continue

      const x1 = Math.max(top.x1, bot.x1)
      const x2 = Math.min(top.x2, bot.x2)
      if (x2 - x1 < MIN_W) continue

      const leftV = mergedV.find(v => Math.abs(v.x - x1) < SNAP && v.y1 <= top.y + SNAP && v.y2 >= bot.y - SNAP)
      const rightV = mergedV.find(v => Math.abs(v.x - x2) < SNAP && v.y1 <= top.y + SNAP && v.y2 >= bot.y - SNAP)

      let completeness = 0.5
      if (leftV) completeness += 0.25
      if (rightV) completeness += 0.25

      let whiteCount = 0
      const samples = 20
      for (let s = 0; s < samples; s++) {
        const sx = Math.round(x1 + (x2 - x1) * s / samples)
        const sy = Math.round(top.y + boxH * s / samples)
        if (gray[sy * width + sx] > 200) whiteCount++
      }
      const whiteness = whiteCount / samples

      candidates.push({
        px: x1, py: top.y, pw: x2 - x1, ph: boxH,
        confidence: Math.round((completeness * 0.6 + whiteness * 0.4) * 100) / 100
      })
    }
  }

  return dedup(candidates).map(b => ({
    x: Math.round((b.px / width) * 1000) / 10,
    y: Math.round((b.py / height) * 1000) / 10,
    w: Math.round((b.pw / width) * 1000) / 10,
    h: Math.round((b.ph / height) * 1000) / 10,
    confidence: b.confidence,
    page
  }))
}

function mergeLines(lines, axis, tol) {
  const sorted = [...lines].sort((a, b) => a[axis] - b[axis])
  const merged = []
  for (const line of sorted) {
    const last = merged[merged.length - 1]
    if (last && Math.abs(line[axis] - last[axis]) <= tol) {
      if (axis === 'y') { last.x1 = Math.min(last.x1, line.x1); last.x2 = Math.max(last.x2, line.x2) }
      else { last.y1 = Math.min(last.y1, line.y1); last.y2 = Math.max(last.y2, line.y2) }
    } else {
      merged.push({ ...line })
    }
  }
  return merged
}

function iou(a, b) {
  const ix1 = Math.max(a.px, b.px), ix2 = Math.min(a.px + a.pw, b.px + b.pw)
  const iy1 = Math.max(a.py, b.py), iy2 = Math.min(a.py + a.ph, b.py + b.ph)
  if (ix2 <= ix1 || iy2 <= iy1) return 0
  const inter = (ix2 - ix1) * (iy2 - iy1)
  return inter / (a.pw * a.ph + b.pw * b.ph - inter)
}

function dedup(boxes) {
  const result = []
  const used = new Set()
  const sorted = [...boxes].sort((a, b) => b.confidence - a.confidence)
  for (let i = 0; i < sorted.length; i++) {
    if (used.has(i)) continue
    result.push(sorted[i])
    for (let j = i + 1; j < sorted.length; j++) {
      if (iou(sorted[i], sorted[j]) > 0.4) used.add(j)
    }
  }
  return result
}
```

- [ ] **Step 2: Verify the file renders without errors**

Open browser console on the running dev server (http://localhost:3000) and paste:
```js
import('/lib/detectBoxes').then(m => console.log('detectBoxes loaded:', typeof m.detectBoxes))
```
Expected: `detectBoxes loaded: function`

---

## Task 2: Extract `renderPageCanvases()`, refactor `renderCanvases()`, add `renderRawPages()` and `detectFormBoxes()`

**Files:**
- Modify: `pages/index.js` (around line 438 — `renderCanvases` function)

- [ ] **Step 1: Add `renderPageCanvases()` helper immediately before `renderCanvases()` (line 438)**

This is a new function to insert. Place it at line 438, pushing the existing `renderCanvases` down:

```js
  async function renderPageCanvases() {
    const p0 = pages[0]
    const isPdf = p0?.mime === 'application/pdf'
    const results = []

    if (!isPdf && p0?.previewSrc) {
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i]
        if (!p.previewSrc) continue
        const img = new Image()
        img.src = p.previewSrc
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject })
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
        canvas.getContext('2d').drawImage(img, 0, 0)
        results.push({ canvas, pageNum: i + 1 })
      }
    } else if (isPdf) {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
        let globalPageNum = 1
        for (const p of pages) {
          const arr = Uint8Array.from(atob(p.b64), c => c.charCodeAt(0))
          const pdf = await pdfjsLib.getDocument({ data: arr }).promise
          for (let num = 1; num <= pdf.numPages; num++) {
            const page = await pdf.getPage(num)
            const vp = page.getViewport({ scale: 2 })
            const canvas = document.createElement('canvas')
            canvas.width = vp.width; canvas.height = vp.height
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
            results.push({ canvas, pageNum: globalPageNum++ })
          }
        }
      } catch (err) {
        console.error('PDF render failed:', err)
      }
    }
    return results
  }
```

- [ ] **Step 2: Replace the existing `renderCanvases()` function entirely**

Replace lines 438–479 (the old `renderCanvases`) with this slimmed-down version that delegates to `renderPageCanvases`:

```js
  async function renderCanvases() {
    if (!fields.some(f => f.x != null)) return []
    const rendered = await renderPageCanvases()
    return rendered.map(({ canvas, pageNum }) => {
      overlayCanvas(canvas, pageNum)
      return { dataUrl: canvas.toDataURL('image/jpeg', 0.95), width: canvas.width, height: canvas.height }
    })
  }
```

- [ ] **Step 3: Add `renderRawPages()` and `detectFormBoxes()` immediately after `renderCanvases()`**

```js
  async function renderRawPages() {
    const rendered = await renderPageCanvases()
    return rendered.map(({ canvas }) => ({
      dataUrl: canvas.toDataURL('image/jpeg', 0.95),
      width: canvas.width,
      height: canvas.height
    }))
  }

  async function detectFormBoxes() {
    const rendered = await renderPageCanvases()
    const boxes = []
    rendered.forEach(({ canvas, pageNum }) => boxes.push(...detectBoxes(canvas, pageNum)))
    return boxes
  }
```

- [ ] **Step 4: Add the `detectBoxes` import at the top of the file**

Add after the existing import on line 2:
```js
import { detectBoxes } from '../lib/detectBoxes'
```

- [ ] **Step 5: Verify dev server still compiles**

Check http://localhost:3000 loads without errors. Upload an image form and click Export — the existing preview modal should still appear (behaviour unchanged at this point).

---

## Task 3: Modify `/api/scan.js` — add detected-boxes label-mapping mode

**Files:**
- Modify: `pages/api/scan.js`

- [ ] **Step 1: Read `detectedBoxes` from the request body and build a new prompt branch**

In `scan.js`, after line 18 (`const fillableFieldNames = req.body.fillableFieldNames || null`), add:

```js
  const detectedBoxes = req.body.detectedBoxes || null
```

- [ ] **Step 2: Replace the `promptText` assignment (lines 30–46) with a three-branch version**

```js
    const promptText = fillableFieldNames
      ? `This PDF has fillable form fields with these internal names: ${fillableFieldNames.join(', ')}.
Look at the form and return a JSON array mapping each field name to a human-readable label.
Format (raw JSON array only, no markdown):
{"id":"<exact field name>","label":"Human Readable Label","type":"text"}
Types: text, date, checkbox, number, select, signature, textarea
Return one entry per field name. Start with [ and end with ].`
      : detectedBoxes && detectedBoxes.length > 0
      ? `This form has ${detectedBoxes.length} detected field boxes. Their positions (x,y,w,h as % of page, page is 1-based):
${detectedBoxes.map((b, i) => `b${i}: page=${b.page} x=${b.x} y=${b.y} w=${b.w} h=${b.h} conf=${b.confidence}`).join('\n')}

Look at the form and assign each box a human-readable label and field type.
Return a JSON array only — no markdown, no backticks:
[{"id":"f1","label":"First Name","type":"text","x":10.5,"y":23.2,"w":45.0,"h":4.1,"confidence":0.9,"page":1}]
Rules:
- Use the EXACT x, y, w, h, confidence, page values from the list above — do NOT change coordinates.
- Assign sequential ids: f1, f2, f3, ...
- Types: text, date, checkbox, number, select, signature, textarea
- Omit any box that is clearly not a form field (decorative lines, logo boxes, etc.)
Start with [ and end with ].`
      : `Carefully examine this form (all pages) and identify every fillable field.
Include text fields, checkboxes, date fields, dropdowns, signature lines, and table rows.
Each item must follow this exact JSON format (no markdown, no backticks, no explanation — raw JSON array only):
{"id":"f1","label":"Field name","type":"text","page":1,"x":10.5,"y":23.2,"w":45.0,"h":4.1}
Types: text, date, checkbox, number, select, signature, textarea
page = 1-based page number where the field appears.
x, y, w, h = bounding box of the field input area as % of that page's width/height (left edge, top edge, width, height).
${isPDF ? 'For PDF documents, estimate coordinates based on the visible layout.' : ''}
If coordinates cannot be determined, use null: "x":null,"y":null,"w":null,"h":null
Be thorough — include every field. Start your response with [ and end with ].`
```

- [ ] **Step 3: Verify scan still works**

Upload any form, click Scan. Check the browser network tab — the `/api/scan` request should succeed and return fields. No behaviour change yet (detectedBoxes not passed yet).

---

## Task 4: Modify `scanForm()` — run detection before flat PDF scan

**Files:**
- Modify: `pages/index.js` (around line 263 — the `else` branch of `scanForm`)

- [ ] **Step 1: Replace the flat-PDF/image scan branch in `scanForm()`**

Find lines 263–276:
```js
      } else {
        // Flat PDF or image: standard Claude coordinate scan
        const scanPayload = pages.length === 1
          ? { base64: pages[0].b64, mediaType: pages[0].mime }
          : { pages: pages.map(p => ({ base64: p.b64, mediaType: p.mime })) }
        const res = await fetch('/api/scan', {
```

Replace with:
```js
      } else {
        // Flat PDF or image: detect boxes first, then ask Claude to label them
        let detectedBoxes = []
        try {
          detectedBoxes = await detectFormBoxes()
        } catch (err) {
          console.error('Box detection failed:', err)
        }

        const scanPayload = pages.length === 1
          ? { base64: pages[0].b64, mediaType: pages[0].mime }
          : { pages: pages.map(p => ({ base64: p.b64, mediaType: p.mime })) }

        if (detectedBoxes.length > 0) {
          scanPayload.detectedBoxes = detectedBoxes
          console.log(`Detected ${detectedBoxes.length} boxes, passing to scan`)
        }

        const res = await fetch('/api/scan', {
```

Everything after `const res = await fetch('/api/scan', {` stays identical.

- [ ] **Step 2: Verify detection runs on scan**

Upload a flat PDF or image form, open the browser console, click Scan. You should see:
`Detected N boxes, passing to scan`
where N > 0 for any form with visible field boxes. If N = 0, the existing Claude-guessing path runs silently.

- [ ] **Step 3: Check that returned fields now have confidence scores**

In the browser console after a successful scan, type:
```js
// (after scan completes, inspect the fields state via React DevTools or add a temp log)
```

In `scanForm()`, after `setFields(data.fields)`, temporarily add:
```js
console.log('Fields with confidence:', data.fields.map(f => `${f.label}: ${f.confidence}`))
```

Expected: fields that came from detected boxes should have numeric confidence values (e.g. `0.82`). Fields from the fallback path will have `undefined`.

Remove the console.log before committing.

---

## Task 5: Update state, `exportForm()`, and `downloadFromPreview()`

**Files:**
- Modify: `pages/index.js`

- [ ] **Step 1: Replace `previewUrls` state with `rawPageUrls` (line 107)**

```js
  const [rawPageUrls, setRawPageUrls] = useState([])
```

- [ ] **Step 2: Add `dragRef` immediately after the other refs (around line 113)**

```js
  const dragRef = useRef(null)
```

- [ ] **Step 3: Replace `exportForm()` entirely (lines 529–563)**

```js
  async function exportForm() {
    const p0 = pages[0]
    const isPdf = p0?.mime === 'application/pdf'

    // Fillable PDF: exact fill, no preview
    if (isFillablePdf && isPdf) {
      const result = await buildPdf()
      const blob = new Blob([result.bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'completed_form.pdf'; a.click()
      URL.revokeObjectURL(url)
      return
    }

    // Flat PDF / image: show interactive preview
    if (fields.some(f => f.x != null)) {
      const raw = await renderRawPages()
      if (raw.length > 0) {
        setRawPageUrls(raw)
        setShowExportPreview(true)
        return
      }
    }

    // No coords at all: summary PDF
    const result = await buildPdf()
    result.save('completed_form.pdf')
  }
```

- [ ] **Step 4: Replace `downloadFromPreview()` entirely (lines 565–578)**

```js
  async function downloadFromPreview() {
    const { jsPDF } = await import('jspdf')
    const pdfW = 210
    const rendered = await renderCanvases()
    if (!rendered.length) return
    let doc = null
    rendered.forEach(({ dataUrl, width, height }, idx) => {
      const pdfH = (height / width) * pdfW
      if (idx === 0) doc = new jsPDF({ orientation: pdfH > pdfW ? 'portrait' : 'landscape', unit: 'mm', format: [pdfW, pdfH] })
      else doc.addPage([pdfW, pdfH], pdfH > pdfW ? 'portrait' : 'landscape')
      doc.addImage(dataUrl, 'JPEG', 0, 0, pdfW, pdfH)
    })
    doc.save('completed_form.pdf')
    setShowExportPreview(false)
    setRawPageUrls([])
  }
```

- [ ] **Step 5: Verify export still works end-to-end**

Fill at least one field via chat, click Export. The preview modal should appear showing the raw form image (no overlay text yet — that gets baked only on Download). Click Download — the PDF should download with field text overlaid.

---

## Task 6: Add drag handlers and replace preview modal JSX

**Files:**
- Modify: `pages/index.js`

- [ ] **Step 1: Add the three drag handler functions inside `Home()`, after `downloadFromPreview()`**

```js
  function handleDragStart(e, fieldId) {
    e.preventDefault()
    const container = e.currentTarget.parentElement
    const rect = container.getBoundingClientRect()
    const f = fields.find(f => f.id === fieldId)
    dragRef.current = {
      fieldId,
      containerRect: rect,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startFx: f.x,
      startFy: f.y,
    }
  }

  function handleDragMove(e) {
    if (!dragRef.current) return
    const { fieldId, containerRect, startMouseX, startMouseY, startFx, startFy } = dragRef.current
    const dx = ((e.clientX - startMouseX) / containerRect.width) * 100
    const dy = ((e.clientY - startMouseY) / containerRect.height) * 100
    setFields(prev => prev.map(f =>
      f.id === fieldId ? { ...f, x: Math.max(0, startFx + dx), y: Math.max(0, startFy + dy) } : f
    ))
  }

  function handleDragEnd() {
    dragRef.current = null
  }
```

- [ ] **Step 2: Replace the preview modal JSX (lines 765–789)**

Replace this entire block:
```jsx
      {showExportPreview && (() => {
        const omitted = fields.filter(f => filledValues[f.id] && (f.x == null || f.y == null))
        return (
          ...
        )
      })()}
```

With:
```jsx
      {showExportPreview && (() => {
        const omitted = fields.filter(f => filledValues[f.id] && (f.x == null || f.y == null))
        const lowConf = fields.filter(f => filledValues[f.id] && f.x != null && f.confidence != null && f.confidence < 0.5)
        const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768
        return (
          <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowExportPreview(false); setRawPageUrls([]) } }}>
            <div style={s.previewModal}>
              <div style={s.previewModalHdr}>Preview — verify field placement</div>

              {omitted.length > 0 && (
                <div style={{ fontSize: 12, color: '#7a4a00', background: '#FFF8E1', border: '0.5px solid #FFD54F', borderRadius: 6, padding: '7px 10px' }}>
                  ⚠ {omitted.length} filled field{omitted.length > 1 ? 's' : ''} have no position data and will be <strong>missing</strong> from the PDF: {omitted.map(f => f.label).join(', ')}
                </div>
              )}
              {lowConf.length > 0 && (
                <div style={{ fontSize: 12, color: '#7a4a00', background: '#FFF8E1', border: '0.5px solid #FFD54F', borderRadius: 6, padding: '7px 10px', marginTop: omitted.length > 0 ? 4 : 0 }}>
                  ⚠ {lowConf.length} field{lowConf.length > 1 ? 's' : ''} have low-confidence placement{isDesktop ? ' — drag boxes to reposition' : ''}: {lowConf.map(f => f.label).join(', ')}
                </div>
              )}
              {omitted.length === 0 && lowConf.length === 0 && (
                <div style={s.previewModalSub}>
                  All fields placed.{isDesktop ? ' Drag any highlighted box to reposition.' : ''} Click Download when ready.
                </div>
              )}

              <div style={s.previewImgWrap}
                onMouseMove={isDesktop ? handleDragMove : undefined}
                onMouseUp={isDesktop ? handleDragEnd : undefined}
                onMouseLeave={isDesktop ? handleDragEnd : undefined}
              >
                {rawPageUrls.map(({ dataUrl }, pageIdx) => {
                  const pageNum = pageIdx + 1
                  const pageFields = fields.filter(f =>
                    (f.page || 1) === pageNum &&
                    f.x != null &&
                    filledValues[f.id] &&
                    !/^n\/?a$/i.test(filledValues[f.id].trim())
                  )
                  return (
                    <div key={pageIdx} style={{ position: 'relative', width: '100%' }}>
                      <img src={dataUrl} alt={`Page ${pageIdx + 1}`} style={{ width: '100%', borderRadius: 4, display: 'block' }} />
                      {pageFields.map(f => (
                        <div
                          key={f.id}
                          style={{
                            position: 'absolute',
                            left: `${f.x}%`, top: `${f.y}%`,
                            width: `${f.w}%`, height: `${f.h}%`,
                            border: `1.5px solid ${f.confidence != null && f.confidence < 0.5 ? '#FFB300' : '#1D9E75'}`,
                            background: 'rgba(29,158,117,0.10)',
                            cursor: isDesktop ? 'move' : 'default',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 2px',
                            boxSizing: 'border-box',
                            userSelect: 'none',
                          }}
                          onMouseDown={isDesktop ? (e) => handleDragStart(e, f.id) : undefined}
                        >
                          <span style={{ fontSize: '0.7vw', color: '#085041', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                            {f.type === 'checkbox'
                              ? (/yes|true|x/i.test(filledValues[f.id]) ? '✔' : '')
                              : filledValues[f.id]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>

              <div style={s.modalRow}>
                <button style={s.modalCancel} onClick={() => { setShowExportPreview(false); setRawPageUrls([]) }}>Cancel</button>
                <button style={s.previewDlBtn} onClick={downloadFromPreview}>Download PDF</button>
              </div>
            </div>
          </div>
        )
      })()}
```

- [ ] **Step 3: Verify the interactive preview works in incognito Chrome**

1. Upload a flat PDF or image form
2. Scan it (check console: "Detected N boxes")
3. Fill at least 3 fields via chat
4. Click Export — preview modal should open showing the raw form with green outlined boxes over detected fields, filled values visible inside each box
5. On desktop: click and drag a field box — it should reposition
6. Click Download PDF — the PDF should download with field text at the (possibly corrected) positions
7. Low-confidence boxes (yellow border) should show amber warning text above the preview
8. Fillable PDF path should be unaffected — upload a fillable PDF and confirm it downloads directly without the preview

---

## Task 7: Commit

- [ ] **Step 1: Commit all changes**

```bash
git add lib/detectBoxes.js pages/api/scan.js pages/index.js docs/superpowers/specs/2026-05-16-phase2-ocr-geometry-design.md docs/superpowers/plans/2026-05-16-phase2-ocr-geometry.md
git commit -m "feat: Phase 2 — canvas rectangle detection replaces Claude coordinate guessing

- lib/detectBoxes.js: pure-JS rectangle detector, returns x/y/w/h/confidence as page %
- scan.js: new detected-boxes label-mapping mode (third prompt branch)
- index.js: renderPageCanvases() shared helper, detectFormBoxes() runs before flat PDF scan
- index.js: interactive preview modal — raw page + positioned field boxes, drag-to-correct desktop
- index.js: low-confidence (< 0.5) fields show amber warning in preview

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- ✅ `lib/detectBoxes.js` — three-pass detector, percentage output, confidence scoring (Task 1)
- ✅ `/api/scan.js` detected-boxes mode — Claude maps labels, coordinates unchanged (Task 3)
- ✅ Detection runs before flat PDF scan (Task 4)
- ✅ Fillable PDF path untouched throughout
- ✅ `renderPageCanvases()` shared helper eliminates rendering duplication (Task 2)
- ✅ Interactive preview: raw page + positioned field divs (Task 6)
- ✅ Drag-to-correct desktop only (Task 6, `isDesktop` guard)
- ✅ Low-confidence amber warning in preview (Task 6)
- ✅ Null-coord omission warning preserved (Task 6)
- ✅ Mobile: no drag UI, warnings shown, summary fallback if no coords (Task 5 exportForm)
- ✅ Multi-page forms: `pageNum` on every detected box, preview iterates `rawPageUrls` by page (Tasks 1, 6)
- ✅ Fallback: zero boxes detected → `scanPayload` sent without `detectedBoxes` → Claude guesses (Task 4)

**Placeholder scan:** None found.

**Type consistency:**
- `detectBoxes()` returns `{x,y,w,h,confidence,page}` — consumed identically in `detectFormBoxes()` and passed as `scanPayload.detectedBoxes`
- `renderPageCanvases()` returns `{canvas, pageNum}[]` — consumed by `renderCanvases()`, `renderRawPages()`, `detectFormBoxes()` consistently
- `rawPageUrls` state is `{dataUrl, width, height}[]` — set by `renderRawPages()`, read by preview modal `rawPageUrls.map()`
- `dragRef.current` shape `{fieldId, containerRect, startMouseX, startMouseY, startFx, startFy}` — set in `handleDragStart`, read in `handleDragMove`
- `confidence` field on field objects: number 0–1 from detector, passed through scan API, read as `f.confidence` in preview modal JSX
