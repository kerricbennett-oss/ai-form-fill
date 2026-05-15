import { useState, useRef, useEffect } from 'react'

const s = {
  app: { display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 1100, margin: '0 auto', padding: '16px', gap: 12 },
  header: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5' },
  headerTitle: { fontSize: 15, fontWeight: 600, flex: 1 },
  pill: { fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '0.5px solid #e0e0e0', color: '#666', background: '#f9f9f9' },
  pillGreen: { fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '0.5px solid #5DCAA5', color: '#085041', background: '#E1F5EE' },
  pillBlue: { fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '0.5px solid #85B7EB', color: '#0C447C', background: '#E6F1FB' },
  main: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 },
  card: { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  cardHdr: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '0.5px solid #eee', background: '#fafafa', fontSize: 12, fontWeight: 500, color: '#555' },
  cardHdrRight: { marginLeft: 'auto', fontSize: 11, color: '#999', fontWeight: 400 },

  dropZone: { margin: 14, border: '1.5px dashed #ddd', borderRadius: 10, padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#fafafa', transition: 'all 0.2s' },
  dropZoneHover: { borderColor: '#1D9E75', background: '#E1F5EE' },
  dropIcon: { fontSize: 32, color: '#bbb' },
  dropText: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 1.5 },
  dropSub: { fontSize: 11, color: '#aaa' },
  browseBtn: { fontSize: 12, padding: '5px 14px', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', color: '#333', cursor: 'pointer' },

  previewBox: { margin: '0 14px', border: '0.5px solid #eee', borderRadius: 8, overflow: 'hidden' },
  previewTop: { display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', background: '#fafafa', borderBottom: '0.5px solid #eee', fontSize: 12 },
  previewFname: { flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 },
  rmBtn: { fontSize: 11, color: '#e24b4a', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 },
  pdfThumb: { height: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f9f9f9', color: '#999', fontSize: 12 },

  scanBtn: { margin: '12px 14px 14px', padding: '10px', borderRadius: 8, border: 'none', background: '#1D9E75', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 },
  scanBtnDisabled: { margin: '12px 14px 14px', padding: '10px', borderRadius: 8, border: 'none', background: '#1D9E75', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'not-allowed', opacity: 0.45, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 },

  right: { display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 },
  fieldsCard: { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden', flexShrink: 0 },
  fieldsScroll: { maxHeight: 380, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 },
  fieldsEmpty: { padding: '20px 16px', fontSize: 13, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
  fi: { display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', borderRadius: 8, border: '0.5px solid #eee', background: '#fff' },
  fiActive: { display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', borderRadius: 8, border: '0.5px solid #1D9E75', background: '#F0FAF6' },
  fiLbl: { fontSize: 11, color: '#888', width: 140, flexShrink: 0 },
  fiValEmpty: { fontSize: 11, color: '#bbb', fontStyle: 'italic', flex: 1 },
  fiValFilling: { fontSize: 11, color: '#0C447C', background: '#E6F1FB', padding: '1px 6px', borderRadius: 3, flex: 1 },
  fiValFilled: { fontSize: 11, color: '#085041', background: '#E1F5EE', padding: '1px 6px', borderRadius: 3, flex: 1 },
  fiDot: { width: 7, height: 7, borderRadius: '50%', background: '#ddd', flexShrink: 0 },
  fiDotDone: { width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 },
  fiEditBtn: { fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '0 2px', flexShrink: 0 },
  fiEditInput: { fontSize: 11, flex: 1, border: '0.5px solid #1D9E75', borderRadius: 3, padding: '1px 6px', outline: 'none', color: '#085041', background: '#E1F5EE' },
  stopBtn: { width: 36, height: 36, borderRadius: '50%', border: '0.5px solid #E24B4A', background: '#FCEBEB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A32D2D', flexShrink: 0, fontSize: 14 },

  chatCard: { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' },
  msgs: { flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  msgAi: { alignSelf: 'flex-start', maxWidth: '88%' },
  msgUser: { alignSelf: 'flex-end', maxWidth: '88%' },
  bubbleAi: { fontSize: 13, lineHeight: 1.5, padding: '8px 12px', borderRadius: 12, borderBottomLeftRadius: 3, background: '#f5f5f3', border: '0.5px solid #eee', color: '#1a1a1a' },
  bubbleUser: { fontSize: 13, lineHeight: 1.5, padding: '8px 12px', borderRadius: 12, borderBottomRightRadius: 3, background: '#1D9E75', color: '#fff' },
  typingBubble: { display: 'flex', gap: 3, padding: '10px 12px', background: '#f5f5f3', border: '0.5px solid #eee', borderRadius: 12, borderBottomLeftRadius: 3, width: 'fit-content' },
  typingDot: { width: 5, height: 5, borderRadius: '50%', background: '#bbb' },

  inputRow: { display: 'flex', gap: 6, padding: '10px 12px', borderTop: '0.5px solid #eee', background: '#fafafa', alignItems: 'flex-end' },
  textarea: { flex: 1, resize: 'none', border: '0.5px solid #ddd', borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', color: '#1a1a1a', background: '#fff', minHeight: 36, maxHeight: 90, lineHeight: 1.4, outline: 'none' },
  micBtn: { width: 36, height: 36, borderRadius: '50%', border: '0.5px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', flexShrink: 0, fontSize: 16 },
  micBtnRec: { width: 36, height: 36, borderRadius: '50%', border: '0.5px solid #E24B4A', background: '#FCEBEB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A32D2D', flexShrink: 0, fontSize: 16 },
  sendBtn: { width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#1D9E75', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, fontSize: 15 },
  sendBtnDisabled: { width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#1D9E75', cursor: 'not-allowed', opacity: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, fontSize: 15 },

  bottomBar: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5' },
  progTrack: { flex: 1, height: 4, background: '#eee', borderRadius: 4 },
  progFill: { height: 4, background: '#1D9E75', borderRadius: 4, transition: 'width 0.5s' },
  progLbl: { fontSize: 11, color: '#999', whiteSpace: 'nowrap' },
  expBtn: { fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '0.5px solid #1D9E75', color: '#1D9E75', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' },
  expBtnDisabled: { fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '0.5px solid #ddd', color: '#bbb', background: 'transparent', cursor: 'not-allowed', fontFamily: 'inherit' },
}

export default function Home() {
  const [file, setFile] = useState(null)
  const [b64, setB64] = useState(null)
  const [mime, setMime] = useState(null)
  const [previewSrc, setPreviewSrc] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [fields, setFields] = useState([])
  const [filledValues, setFilledValues] = useState({})
  const [fillingIds, setFillingIds] = useState({})
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Upload your form and hit Scan — I\'ll detect every field, then we\'ll fill them together through conversation.' }])
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isDrag, setIsDrag] = useState(false)
  const [isRec, setIsRec] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [activeFieldId, setActiveFieldId] = useState(null)
  const msgsRef = useRef(null)
  const fileRef = useRef(null)
  const recogRef = useRef(null)
  const textareaRef = useRef(null)
  const fieldsScrollRef = useRef(null)
  const fieldItemRefs = useRef({})
  const handleSendRef = useRef(null)

  function stopAll() {
    window.speechSynthesis?.cancel()
    recogRef.current?.stop()
    setIsRec(false)
    setAutoMode(false)
  }

  function startListening(auto = false) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.continuous = true; r.interimResults = true; r.lang = 'en-US'
    recogRef.current = r
    if (auto) setAutoMode(true)
    setIsRec(true)

    let silenceTimer = null
    r.onresult = e => {
      const transcript = Array.from(e.results).map(x => x[0].transcript).join('')
      setInput(transcript)
      // reset silence timer on every new speech result
      clearTimeout(silenceTimer)
      silenceTimer = setTimeout(() => {
        r.stop()
      }, 3500)
    }
    r.onend = () => {
      clearTimeout(silenceTimer)
      setIsRec(false)
      setTimeout(() => { if (textareaRef.current?.value?.trim()) handleSendRef.current?.() }, 200)
    }
    r.onerror = () => { clearTimeout(silenceTimer); setIsRec(false); setAutoMode(false) }
    r.start()
  }

  function speak(text, autoRestart = false) {
    if (!window.speechSynthesis) {
      if (autoRestart) startListening(true)
      return
    }
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 1.0
    if (autoRestart) utt.onend = () => startListening(true)
    window.speechSynthesis.speak(utt)
  }

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    const ids = Object.keys(fillingIds)
    if (ids.length > 0 && fieldItemRefs.current[ids[0]]) {
      fieldItemRefs.current[ids[0]].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [fillingIds])

  function loadFile(f) {
    const isPDF = f.type === 'application/pdf'
    const isImg = f.type.startsWith('image/')
    if (!isPDF && !isImg) { alert('Please upload a JPG, PNG, or PDF.'); return }
    setMime(f.type)
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => {
      const data = e.target.result
      setB64(data.split(',')[1])
      setPreviewSrc(isImg ? data : null)
    }
    reader.readAsDataURL(f)
    setScanned(false)
    setFields([])
    setFilledValues({})
    setFillingIds({})
    setHistory([])
    setMessages([{ role: 'ai', text: 'Form loaded! Hit "Scan & detect fields" to read your form.' }])
  }

  async function scanForm() {
    setScanning(true)
    setMessages(m => [...m, { role: 'ai', text: 'Reading your form and detecting all fields…' }])
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: b64, mediaType: mime })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scan failed')
      setFields(data.fields)
      setScanned(true)
      const sample = data.fields.slice(0, 3).map(f => f.label).join(', ')
      const more = data.fields.length > 3 ? ` and ${data.fields.length - 3} more` : ''
      const scanMsg = `Found ${data.fields.length} fields: ${sample}${more}. Just talk naturally and I'll fill them in as you go!`
      setMessages(m => [...m, { role: 'ai', text: scanMsg }])
      speak(scanMsg)
    } catch (err) {
      setMessages(m => [...m, { role: 'ai', text: `Scan failed: ${err.message}. Please try again.` }])
    }
    setScanning(false)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || !fields.length || sending) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = '36px'
    const newHistory = [...history, { role: 'user', content: text }]
    setHistory(newHistory)
    setMessages(m => [...m, { role: 'user', text }, { role: 'typing' }])
    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, fields, filledValues, history })
      })
      const data = await res.json()
      setHistory(h => [...h, { role: 'assistant', content: data.reply || '' }])
      setMessages(m => m.filter(x => x.role !== 'typing'))

      const validIds = new Set(fields.map(f => f.id))
      console.log('API returned extracted:', JSON.stringify(data.extracted))
      const extracted = Object.fromEntries(
        Object.entries(data.extracted || {})
          .filter(([id, val]) => validIds.has(id) && val !== null && val !== undefined && val !== '')
          .map(([id, val]) => {
            if (val === true || val === 'true') return [id, 'Yes']
            if (val === false || val === 'false') return [id, 'No']
            return [id, String(val)]
          })
      )
      console.log('After filter extracted:', JSON.stringify(extracted))

      // highlight the field being asked about next
      if (data.askingId && fields.find(f => f.id === data.askingId)) {
        setActiveFieldId(data.askingId)
        fieldItemRefs.current[data.askingId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }

      if (Object.keys(extracted).length > 0) {
        const ids = Object.keys(extracted)
        setFillingIds(prev => { const n = { ...prev }; ids.forEach(id => { n[id] = true }); return n })
        setTimeout(() => {
          setFilledValues(prev => {
            const n = { ...prev }
            Object.entries(extracted).forEach(([id, val]) => { n[id] = val })
            return n
          })
          setFillingIds(prev => { const n = { ...prev }; ids.forEach(id => { delete n[id] }); return n })
        }, 450)
        const newFields = ids.map(id => fields.find(f => f.id === id)?.label).filter(Boolean)
        const reply = data.reply || 'Got it!'
        setMessages(m => [...m.filter(x => x.role !== 'typing'), { role: 'ai', text: reply, tags: newFields }])
        speak(reply, true)
      } else {
        const reply = data.reply || 'Got it, keep going!'
        setMessages(m => [...m.filter(x => x.role !== 'typing'), { role: 'ai', text: reply }])
        speak(reply, true)
      }
    } catch (err) {
      setMessages(m => [...m.filter(x => x.role !== 'typing'), { role: 'ai', text: 'Something went wrong. Please try again.' }])
    }
    setSending(false)
  }

  function handleMic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not available in this browser. Please use Chrome.')
      return
    }
    if (isRec || autoMode) { stopAll(); return }
    startListening(true)
  }

  async function exportForm() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // Page 1: original form image
    if (b64 && mime && mime.startsWith('image/')) {
      const imgData = `data:${mime};base64,${b64}`
      const fmt = mime.includes('png') ? 'PNG' : 'JPEG'
      doc.addImage(imgData, fmt, 10, 10, 190, 0)
    } else {
      doc.setFontSize(13)
      doc.setTextColor(150)
      doc.text('(PDF upload — original form not shown)', 105, 148, { align: 'center' })
    }

    // Page 2: completed summary
    doc.addPage()
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(0)
    doc.text('COMPLETED FORM', 105, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(120)
    doc.text(`Exported: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' })
    doc.setDrawColor(200)
    doc.line(15, 33, 195, 33)

    let y = 43
    doc.setTextColor(0)
    fields.forEach(f => {
      const val = filledValues[f.id] || '(blank)'
      doc.setFont(undefined, 'bold')
      doc.setFontSize(10)
      doc.text(`${f.label}:`, 15, y)
      doc.setFont(undefined, 'normal')
      const lines = doc.splitTextToSize(val, 115)
      doc.text(lines, 80, y)
      y += Math.max(8, lines.length * 6)
      if (y > 270) { doc.addPage(); y = 20 }
    })

    doc.save('completed_form.pdf')
  }

  const filledCount = Object.keys(filledValues).length
  const pct = fields.length ? Math.round((filledCount / fields.length) * 100) : 0
  handleSendRef.current = handleSend

  return (
    <div style={s.app}>
      <div style={s.header}>
        <span style={{ fontSize: 18 }}>🔍</span>
        <span style={s.headerTitle}>AI Form Fill</span>
        {scanning && <span style={s.pillBlue}>Scanning…</span>}
        {scanned && !scanning && <span style={s.pillGreen}>{fields.length} fields detected</span>}
        {!scanning && !scanned && <span style={s.pill}>Upload a form to start</span>}
      </div>

      <div style={s.main}>
        {/* LEFT */}
        <div style={s.card}>
          <div style={s.cardHdr}>
            📄 Form upload
          </div>

          {!file ? (
            <div
              style={{ ...s.dropZone, ...(isDrag ? s.dropZoneHover : {}) }}
              onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
              onDragLeave={() => setIsDrag(false)}
              onDrop={e => { e.preventDefault(); setIsDrag(false); e.dataTransfer.files[0] && loadFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
            >
              <div style={{ fontSize: 32, color: '#bbb' }}>☁️</div>
              <p style={s.dropText}>Drop your form here<br />or click to browse</p>
              <small style={s.dropSub}>Supports JPG · PNG · PDF</small>
            </div>
          ) : (
            <div style={{ ...s.previewBox, margin: 14 }}>
              <div style={s.previewTop}>
                <span>📎</span>
                <span style={s.previewFname}>{file.name}</span>
                <button style={s.rmBtn} onClick={() => { setFile(null); setB64(null); setScanned(false); setFields([]); setFilledValues({}); setHistory([]); setMessages([{ role: 'ai', text: 'Upload your form and hit Scan — I\'ll detect every field, then we\'ll fill them together through conversation.' }]) }}>Remove</button>
              </div>
              {previewSrc
                ? <img src={previewSrc} alt="Form preview" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', background: '#f5f5f3' }} />
                : <div style={s.pdfThumb}><span style={{ fontSize: 36 }}>📋</span><span>{file.name}</span><span style={{ fontSize: 11, color: '#bbb' }}>Ready to scan</span></div>
              }
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => e.target.files[0] && loadFile(e.target.files[0])} />

          <button
            style={(!file || scanning) ? s.scanBtnDisabled : s.scanBtn}
            disabled={!file || scanning}
            onClick={scanForm}
          >
            {scanning ? '⏳ Scanning…' : scanned ? '✓ Re-scan form' : '🔍 Scan & detect fields'}
          </button>
        </div>

        {/* RIGHT */}
        <div style={s.right}>
          <div style={s.fieldsCard}>
            <div style={s.cardHdr}>
              📋 Detected fields
              <span style={s.cardHdrRight}>{fields.length > 0 ? `${filledCount} / ${fields.length} filled` : ''}</span>
            </div>
            {fields.length === 0
              ? <div style={s.fieldsEmpty}>Scan a form to detect its fields</div>
              : <div ref={fieldsScrollRef} style={s.fieldsScroll}>
                  {fields.map(f => (
                    <div key={f.id} ref={el => { if (el) fieldItemRefs.current[f.id] = el; else delete fieldItemRefs.current[f.id] }} style={activeFieldId === f.id ? s.fiActive : s.fi}>
                      <span style={s.fiLbl}>{f.label}</span>
                      {editingId === f.id
                        ? <input
                            autoFocus
                            style={s.fiEditInput}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => { setFilledValues(p => ({ ...p, [f.id]: editValue })); setEditingId(null) }}
                            onKeyDown={e => { if (e.key === 'Enter') { setFilledValues(p => ({ ...p, [f.id]: editValue })); setEditingId(null) } if (e.key === 'Escape') setEditingId(null) }}
                          />
                        : <span style={filledValues[f.id] ? s.fiValFilled : fillingIds[f.id] ? s.fiValFilling : s.fiValEmpty}>
                            {filledValues[f.id] || (fillingIds[f.id] ? 'extracting…' : 'empty')}
                          </span>
                      }
                      {filledValues[f.id] && editingId !== f.id && (
                        <button style={s.fiEditBtn} title="Edit" onClick={() => { setEditingId(f.id); setEditValue(filledValues[f.id]) }}>✏</button>
                      )}
                      <div style={filledValues[f.id] ? s.fiDotDone : s.fiDot} />
                    </div>
                  ))}
                </div>
            }
          </div>

          <div style={s.chatCard}>
            <div style={s.cardHdr}>💬 Fill by conversation</div>
            <div ref={msgsRef} style={s.msgs}>
              {messages.map((m, i) => {
                if (m.role === 'typing') return (
                  <div key={i} style={s.msgAi}>
                    <div style={s.typingBubble}>
                      {[0,1,2].map(j => <div key={j} style={{ ...s.typingDot, animation: `bounce 1.1s ${j*0.18}s infinite` }} />)}
                    </div>
                  </div>
                )
                return (
                  <div key={i} style={m.role === 'user' ? s.msgUser : s.msgAi}>
                    <div style={m.role === 'user' ? s.bubbleUser : s.bubbleAi}>
                      {m.text}
                      {m.tags?.length > 0 && (
                        <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {m.tags.map(t => <span key={t} style={{ fontSize: 10, background: '#E1F5EE', color: '#085041', padding: '1px 6px', borderRadius: 3 }}>✓ {t}</span>)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={s.inputRow}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = '36px'; e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={scanned ? 'Talk naturally to fill the form…' : 'Scan a form first…'}
                disabled={!scanned || sending}
                style={s.textarea}
                rows={1}
              />
              {autoMode
                ? <button style={s.stopBtn} onClick={stopAll} title="Stop conversation">⏹</button>
                : <button style={isRec ? s.micBtnRec : s.micBtn} onClick={handleMic} disabled={!scanned} title="Speak">🎤</button>
              }
              <button style={(!scanned || sending) ? s.sendBtnDisabled : s.sendBtn} onClick={handleSend} disabled={!scanned || sending}>
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={s.bottomBar}>
        <div style={s.progTrack}><div style={{ ...s.progFill, width: pct + '%' }} /></div>
        <span style={s.progLbl}>{pct}% complete</span>
        <button style={filledCount === 0 ? s.expBtnDisabled : s.expBtn} onClick={exportForm} disabled={filledCount === 0}>
          Export as PDF
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
        button:hover { opacity: 0.88; }
        textarea:focus { border-color: #1D9E75 !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
      `}</style>
    </div>
  )
}
