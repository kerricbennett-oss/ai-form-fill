import { Resend } from 'resend'

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } }
}

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to, pdfBase64 } = req.body
  if (!to || !pdfBase64) return res.status(400).json({ error: 'Missing email or PDF data' })

  const from = process.env.RESEND_FROM_EMAIL || 'AI Form Fill <onboarding@resend.dev>'

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: 'Your Completed Form',
      html: '<p>Please find your completed form attached.</p>',
      attachments: [{ filename: 'completed_form.pdf', content: pdfBase64 }]
    })
    if (error) return res.status(400).json({ error: error.message })
    res.json({ ok: true })
  } catch (err) {
    console.error('Email error:', err)
    res.status(500).json({ error: err.message })
  }
}
