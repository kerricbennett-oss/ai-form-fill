import { PDFDocument } from 'pdf-lib'

/**
 * Detects AcroForm fields in a PDF and returns their names, types, and page positions.
 * Returns null if the PDF has no fillable fields.
 * Coordinates are returned as percentages of page dimensions.
 */
export async function detectFillableFields(base64) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const form = pdfDoc.getForm()
  const rawFields = form.getFields()
  if (!rawFields.length) return null

  const pages = pdfDoc.getPages()

  return rawFields.map(field => {
    const name = field.getName()
    const typeName = field.constructor.name // PDFTextField, PDFCheckBox, PDFDropdown, etc.
    const type = resolveType(typeName)

    // Get position from first widget annotation
    let x = null, y = null, w = null, h = null, page = 1
    try {
      const widgets = field.acroField.Widgets()
      if (widgets && widgets.length > 0) {
        const widget = widgets[0]
        const rect = widget.Rect()
        if (rect) {
          const [x1, y1, x2, y2] = rect.asRectangle()
          // Find which page this widget is on
          const pageIndex = pdfDoc.getPages().findIndex(p => {
            const annots = p.node.Annots()
            if (!annots) return false
            return annots.asArray().some(ref => ref.objectNumber === widget.dict.objectNumber)
          })
          const pageNum = pageIndex >= 0 ? pageIndex : 0
          const pg = pages[pageNum]
          const { width: pgW, height: pgH } = pg.getSize()
          // PDF coords: origin bottom-left, y1 < y2
          x = (x1 / pgW) * 100
          y = ((pgH - y2) / pgH) * 100  // flip to top-origin
          w = ((x2 - x1) / pgW) * 100
          h = ((y2 - y1) / pgH) * 100
          page = pageNum + 1
        }
      }
    } catch (_) { /* widget position unavailable */ }

    return { id: name, label: name, type, page, x, y, w, h, pdfFieldName: name }
  })
}

/**
 * Fills a fillable PDF with the provided values and returns the bytes.
 */
export async function fillPdf(base64, filledValues) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const form = pdfDoc.getForm()

  for (const [fieldName, value] of Object.entries(filledValues)) {
    if (!value) continue
    try {
      const field = form.getField(fieldName)
      const typeName = field.constructor.name
      if (typeName === 'PDFCheckBox') {
        const checked = /yes|true|x/i.test(value)
        checked ? field.check() : field.uncheck()
      } else if (typeName === 'PDFDropdown' || typeName === 'PDFOptionList') {
        field.select(value)
      } else {
        field.setText(String(value))
      }
    } catch (_) { /* field not found or incompatible value — skip */ }
  }

  form.flatten()
  const filledBytes = await pdfDoc.save()
  return filledBytes
}

function resolveType(typeName) {
  if (typeName === 'PDFCheckBox') return 'checkbox'
  if (typeName === 'PDFDropdown' || typeName === 'PDFOptionList') return 'select'
  if (typeName === 'PDFRadioGroup') return 'checkbox'
  if (typeName === 'PDFSignature') return 'signature'
  return 'text'
}
