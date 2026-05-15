import Anthropic from '@anthropic-ai/sdk'

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } }
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { base64, mediaType } = req.body
  if (!base64 || !mediaType) return res.status(400).json({ error: 'Missing file data' })

  try {
    const contentBlock = mediaType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          contentBlock,
          {
            type: 'text',
            text: `Carefully examine this form and identify every fillable field.
Include text fields, checkboxes, date fields, dropdowns, signature lines, and table rows.
Return ONLY a raw JSON array with no markdown, no backticks, no explanation.
Each item: {"id":"f1","label":"Field name","type":"text"}
Types: text, date, checkbox, number, select, signature, textarea
Be thorough — include every single field visible on the form.`
          }
        ]
      }]
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
