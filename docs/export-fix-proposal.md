# Export Fix Proposal

Goal: correct the flat PDF / image export path so it does not silently keep bad geometry, and so preview/download/email all fail closed instead of falling back to the wrong artifact.

## 1) Snap only when the box is confident enough

```js
function snapFieldsToDetectedBoxes(fields, detectedBoxes) {
  return fields.map((f) => {
    const pageBoxes = detectedBoxes.filter(
      (b) => b.page === f.page && b.confidence >= 0.6
    )

    if (pageBoxes.length === 0) {
      return { ...f, x: null, y: null, w: null, h: null, needsReview: true }
    }

    const fx = (f.x ?? 0) + (f.w ?? 0) / 2
    const fy = (f.y ?? 0) + (f.h ?? 0) / 2

    const containing = pageBoxes.find(
      (b) =>
        fx >= b.x &&
        fx <= b.x + b.w &&
        fy >= b.y &&
        fy <= b.y + b.h
    )

    if (containing) {
      return { ...f, ...containing, needsReview: false }
    }

    const nearest = pageBoxes
      .map((b) => ({
        box: b,
        dist: Math.hypot(fx - (b.x + b.w / 2), fy - (b.y + b.h / 2)),
      }))
      .sort((a, b) => a.dist - b.dist)[0]

    if (!nearest) {
      return { ...f, x: null, y: null, w: null, h: null, needsReview: true }
    }

    const maxDist = Math.min(nearest.box.w, nearest.box.h) / 4
    if (nearest.dist > maxDist) {
      return { ...f, x: null, y: null, w: null, h: null, needsReview: true }
    }

    return { ...f, ...nearest.box, needsReview: false }
  })
}
```

Why this helps:
- It stops the code from keeping Claude coordinates when no match is strong enough.
- It replaces silent drift with an explicit review state.
- It makes incorrect exports less likely on dense or multi-column forms.

## 2) Split visual PDF building from summary fallback

```js
async function buildVisualPdf() {
  const { jsPDF } = await import('jspdf')
  const rendered = await renderCanvases()

  if (!rendered.length) {
    throw new Error('Could not render pages for visual export.')
  }

  const pdfW = 210
  let doc = null

  rendered.forEach(({ dataUrl, width, height }, idx) => {
    const pdfH = (height / width) * pdfW
    if (idx === 0) {
      doc = new jsPDF({
        orientation: pdfH > pdfW ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfW, pdfH],
      })
    } else {
      doc.addPage([pdfW, pdfH], pdfH > pdfW ? 'portrait' : 'landscape')
    }

    doc.addImage(dataUrl, 'JPEG', 0, 0, pdfW, pdfH)
  })

  return doc
}

async function buildSummaryPdf() {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('COMPLETED FORM', 105, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(`Exported: ${new Date().toLocaleDateString()}`, 105, 28, {
    align: 'center',
  })

  return doc
}
```

Why this helps:
- The visual path should succeed or fail as a visual export.
- Summary output should be explicit, not a hidden fallback inside the same function.
- Email and preview can then choose the correct artifact intentionally.

## 3) Make preview download use the visual export path only

```js
async function downloadFromPreview() {
  try {
    const doc = await buildVisualPdf()
    doc.save('completed_form.pdf')
  } catch (err) {
    alert(`Preview export failed: ${err.message}`)
    return
  } finally {
    setShowExportPreview(false)
    setRawPageUrls([])
  }
}
```

Why this helps:
- The user only downloads what they previewed.
- If rendering fails, the app stops instead of silently switching artifact type.
- This makes the preview step trustworthy.

## 4) Block export when fields still need review

```js
async function exportForm() {
  if (fields.some((f) => f.needsReview)) {
    alert('Some fields still need review before export.')
    setShowExportPreview(true)
    return
  }

  if (fields.some((f) => f.x != null)) {
    const raw = await renderRawPages()
    if (!raw.length) {
      throw new Error('Could not render pages for preview.')
    }

    setRawPageUrls(raw)
    setShowExportPreview(true)
    return
  }

  const doc = await buildSummaryPdf()
  doc.save('completed_form.pdf')
}
```

Why this helps:
- It prevents a visually plausible but semantically wrong export.
- It keeps the review step in the loop when geometry is uncertain.
- It makes the summary fallback a conscious choice, not a silent surprise.

## 5) Keep email on the same artifact rules

```js
async function sendEmail() {
  if (fields.some((f) => f.needsReview)) {
    alert('Some fields still need review before email export.')
    return
  }

  const p0 = pages[0]
  const isPdf = p0?.mime === 'application/pdf'
  const result = isFillablePdf && isPdf ? await buildPdf() : await buildVisualPdf()

  let pdfBase64
  if (result?.type === 'fillable') {
    pdfBase64 = btoa(String.fromCharCode(...result.bytes))
  } else {
    pdfBase64 = result.output('datauristring').split(',')[1]
  }

  await fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: emailAddr.trim(), pdfBase64 }),
  })
}
```

Why this helps:
- Email should never send a summary fallback unless that is an explicit product choice.
- The emailed artifact should match the reviewed export path.
- It keeps the same rules across download and email so the user sees consistent behavior.

## Short version

- Do not keep Claude geometry when the box match is weak.
- Do not let the visual export silently become a summary export.
- Do not let preview approval bypass the same render path used for download.

That combination is what makes the export flow fail closed instead of failing in place.
