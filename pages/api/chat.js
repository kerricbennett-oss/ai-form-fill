import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { message, fields, filledValues, history } = req.body

  const state = fields.map(f => `${f.id} | ${f.label} | ${filledValues[f.id] || 'EMPTY'}`).join('\n')
  const fieldDefs = fields.map(f => `${f.id}: ${f.label} (${f.type})`).join('\n')

  const nextEmpty = fields.find(f => !filledValues[f.id])

  const validIds = fields.map(f => f.id).join(', ')

  const system = `You are an AI assistant helping fill a form through natural conversation. Be warm, concise, and conversational (1-2 sentences max).

Form fields (ID: label):
${fieldDefs}

Current state (ID | label | value):
${state}

CRITICAL RULES:
- In the "extracted" object, keys MUST be exact field IDs from this list: ${validIds}
- NEVER use field labels (like "Cancer") as keys — always use the ID (like "f18")
- ALWAYS put something in "extracted" when the user provides ANY information — never return extracted:{} when the user gave you data
- For yes/no or checkbox fields, use the string "Yes" or "No" — never use true/false booleans
- When the user answers "no", "nope", "none", or "I don't have any" to a yes/no question, ALWAYS extract "No" for that field — do not leave it empty
- For list fields (medications, allergies, surgeries, etc.): accumulate ALL items the user has mentioned so far into ONE combined value, and write the full combined list every single turn. Example: if the field already has "Lisinopril 10mg" and user now says "also Eliquis 5mg", write extracted: {fX: "Lisinopril 10mg; Eliquis 5mg twice daily (blood thinner)"}
- Never say you "recorded" or "noted" something without also putting it in extracted
- Always overwrite a field with the latest full value (including all accumulated items)
- After filling, ask specifically about the next empty field by its label name
- If user says "skip", "next", or "I don't know", leave it empty and ask about the next field
- If all fields are filled, congratulate the user

Next empty field: ${nextEmpty ? `${nextEmpty.id} — "${nextEmpty.label}"` : 'none — form is complete'}

Respond ONLY in this exact JSON format (no markdown, no backticks):
{"reply":"Your reply here","extracted":{"f1":"value","f2":"value"}}

If nothing to extract, use empty object: {"reply":"...","extracted":{}}
Return raw JSON only — no explanation, no markdown.`

  try {
    const messages = [
      ...history,
      { role: 'user', content: message }
    ]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system,
      messages
    })

    const raw = response.content.map(b => b.text || '').join('').trim()
    let parsed
    try {
      const match = raw.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(match ? match[0] : raw)
    } catch {
      parsed = { reply: raw, extracted: {} }
    }

    console.log('Chat raw:', raw.slice(0, 300))
    console.log('Chat extracted:', JSON.stringify(parsed.extracted))
    // attach the next empty field so the UI can highlight it
    const updatedFilled = { ...filledValues, ...(parsed.extracted || {}) }
    const askingField = fields.find(f => !updatedFilled[f.id])
    res.json({ ...parsed, askingId: askingField?.id || null })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: err.message })
  }
}
