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
