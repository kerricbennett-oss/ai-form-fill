import Anthropic from '@anthropic-ai/sdk'

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } }
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const rawPages = req.body.pages
    ? req.body.pages
    : [{ base64: req.body.base64, mediaType: req.body.mediaType }]

  if (!rawPages.length || !rawPages[0].base64) return res.status(400).json({ error: 'Missing file data' })

  const fillableFieldNames = req.body.fillableFieldNames || null

  try {
    const pageBlocks = rawPages.map(p =>
      p.mediaType === 'application/pdf'
        ? { type: 'document', source: { type: 'base64', media_type: p.mediaType, data: p.base64 } }
        : { type: 'image', source: { type: 'base64', media_type: p.mediaType, data: p.base64 } }
    )

    const isPDF = rawPages.every(p => p.mediaType === 'application/pdf')

    // Label-mapping mode: fillable PDF — Claude maps field names to human-readable labels only
    const promptText = fillableFieldNames
      ? `This PDF has fillable form fields with these internal names: ${fillableFieldNames.join(', ')}.
Look at the form and return a JSON array mapping each field name to a human-readable label.
Format (raw JSON array only, no markdown):
{"id":"<exact field name>","label":"Human Readable Label","type":"text"}
Types: text, date, checkbox, number, select, signature, textarea
Return one entry per field name. Start with [ and end with ].`
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

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            ...pageBlocks,
            { type: 'text', text: promptText }
          ]
        }
      ]
    })

    const raw = response.content.map(b => b.text || '').join('').trim()
    console.log('Claude raw response:', raw.slice(0, 500))
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) return res.status(422).json({ error: 'Could not parse fields', raw: raw.slice(0, 500) })

    const fields = JSON.parse(match[0])
    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(422).json({ error: 'No fields detected', raw: raw.slice(0, 500) })
    }

    res.json({ fields })
  } catch (err) {
    console.error('Scan error:', err)
    res.status(500).json({ error: err.message })
  }
}
