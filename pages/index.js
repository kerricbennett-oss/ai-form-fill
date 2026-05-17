import { useState, useRef, useEffect } from 'react'
import { detectFillableFields, fillPdf } from '../lib/pdfFields'
import { detectBoxes } from '../lib/detectBoxes'

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
  dropZoneHover: { border: '1.5px dashed #1D9E75', background: '#E1F5EE' },
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
  emailBtn: { fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '0.5px solid #85B7EB', color: '#0C447C', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#fff', borderRadius: 14, padding: '28px 28px 22px', width: 340, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
  previewModal: { background: '#fff', borderRadius: 14, padding: '20px 24px', width: '82vw', maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
  previewModalHdr: { fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  previewModalSub: { fontSize: 12, color: '#888', marginTop: -6 },
  previewImgWrap: { overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8, border: '0.5px solid #eee', borderRadius: 8, padding: 8, background: '#f9f9f9' },
  previewDlBtn: { fontSize: 13, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1D9E75', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
  modalTitle: { fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  modalInput: { border: '0.5px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' },
  modalRow: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
  modalCancel: { fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', color: '#666', cursor: 'pointer', fontFamily: 'inherit' },
  modalSend: { fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#1D9E75', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' },
}

export default function Home() {
  const [pages, setPages] = useState([])  // [{b64, mime, previewSrc, name}]
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
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailAddr, setEmailAddr] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [isFillablePdf, setIsFillablePdf] = useState(false)
  const [showExportPreview, setShowExportPreview] = useState(false)
  const [rawPageUrls, setRawPageUrls] = useState([])
  const msgsRef = useRef(null)
  const fileRef = useRef(null)
  const recogRef = useRef(null)
  const textareaRef = useRef(null)
  const fieldsScrollRef = useRef(null)
  const fieldItemRefs = useRef({})
  const handleSendRef = useRef(null)
  const dragRef = useRef(null)

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

  // Prevent browser from opening dropped files as new tabs
  useEffect(() => {
    const prevent = e => e.preventDefault()
    document.addEventListener('dragover', prevent)
    document.addEventListener('drop', prevent)
    return () => { document.removeEventListener('dragover', prevent); document.removeEventListener('drop', prevent) }
  }, [])

  function resetAll(msg = 'Upload your form and hit Scan — I\'ll detect every field, then we\'ll fill them together through conversation.') {
    setPages([])
    setScanned(false)
    setFields([])
    setFilledValues({})
    setFillingIds({})
    setHistory([])
    setMessages([{ role: 'ai', text: msg }])
    setActiveFieldId(null)
    setEditingId(null)
    setEditValue('')
    setShowExportPreview(false)
    setRawPageUrls([])
  }

  function loadFiles(fileList) {
    const arr = Array.from(fileList).filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'))
    if (arr.length === 0) { alert('Please upload JPG, PNG, or PDF files.'); return }

    setScanned(false); setFields([]); setFilledValues({}); setFillingIds({}); setHistory([])
    setShowExportPreview(false); setRawPageUrls([])
    setIsFillablePdf(false)
    setMessages([{ role: 'ai', text: 'Form loaded! Hit "Scan & detect fields" to read your form.' }])

    const loaded = new Array(arr.length)
    let done = 0
    arr.forEach((f, i) => {
      const reader = new FileReader()
      reader.onload = async e => {
        const data = e.target.result
        const b64 = data.split(',')[1]
        loaded[i] = { b64, mime: f.type, previewSrc: f.type.startsWith('image/') ? data : null, name: f.name }
        done++
        if (done === arr.length) {
          setPages([...loaded])
          // Detect fillable PDF fields
          if (f.type === 'application/pdf') {
            try {
              const detected = await detectFillableFields(b64)
              if (detected && detected.length > 0) {
                setIsFillablePdf(true)
                setMessages([{ role: 'ai', text: `Fillable PDF detected with ${detected.length} form fields. Hit "Scan & detect fields" to load them.` }])
              }
            } catch (_) { /* not fillable, continue normally */ }
          }
        }
      }
      reader.readAsDataURL(f)
    })
  }

  async function scanForm() {
    setScanning(true)
    setMessages(m => [...m, { role: 'ai', text: 'Reading your form and detecting all fields…' }])
    try {
      let detectedFields = null

      // For fillable PDFs: use pdf-lib exact geometry, skip Claude coordinate guessing
      if (isFillablePdf && pages[0]?.mime === 'application/pdf') {
        detectedFields = await detectFillableFields(pages[0].b64)
      }

      if (detectedFields && detectedFields.length > 0) {
        // Ask Claude to give human-readable labels for the pdf field names
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: pages[0].b64,
            mediaType: pages[0].mime,
            fillableFieldNames: detectedFields.map(f => f.pdfFieldName)
          })
        })
        const data = await res.json()
        if (res.ok && data.fields) {
          // Merge Claude's labels onto pdf-lib's exact coordinates
          const labelMap = {}
          data.fields.forEach(f => { labelMap[f.id] = f.label })
          detectedFields = detectedFields.map(f => ({
            ...f,
            label: labelMap[f.pdfFieldName] || f.pdfFieldName
          }))
        }
        setFields(detectedFields)
      } else {
        // Flat PDF or image: detect boxes first, then ask Claude to label them
        let scannedFields = null
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
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scanPayload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Scan failed')

        const snappedFields = snapFieldsToBoxes(data.fields, detectedBoxes)
        setFields(snappedFields)
        scannedFields = snappedFields
      }

      setScanned(true)
      const allFields = detectedFields || scannedFields || []
      const sample = allFields.slice(0, 3).map(f => f.label).join(', ')
      const more = allFields.length > 3 ? ` and ${allFields.length - 3} more` : ''
      const scanMsg = `Found ${allFields.length} fields: ${sample}${more}. Just talk naturally and I'll fill them in as you go!`
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
      const extracted = Object.fromEntries(
        Object.entries(data.extracted || {})
          .filter(([id, val]) => validIds.has(id) && val !== null && val !== undefined && val !== '')
          .map(([id, val]) => {
            if (val === true || val === 'true') return [id, 'Yes']
            if (val === false || val === 'false') return [id, 'No']
            return [id, String(val)]
          })
      )

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
        const reply = data.reply || "I didn't catch that — could you say that again?"
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

  function overlayCanvas(canvas, pageNum) {
    const ctx = canvas.getContext('2d')
    const maxFontSize = Math.round(canvas.width * 0.009)
    const minFontSize = 7

    function shrinkToFit(text, boxW, startSize) {
      let size = startSize
      ctx.font = `${size}px Arial, sans-serif`
      while (size > minFontSize && ctx.measureText(text).width > boxW) {
        size--
        ctx.font = `${size}px Arial, sans-serif`
      }
      return size
    }

    function wrapWords(text, boxW) {
      const words = text.split(' ')
      const lines = []
      let line = ''
      for (const word of words) {
        const test = line ? `${line} ${word}` : word
        if (ctx.measureText(test).width <= boxW) { line = test }
        else { if (line) lines.push(line); line = word }
      }
      if (line) lines.push(line)
      return lines
    }

    fields.forEach(f => {
      if ((f.page || 1) !== pageNum) return
      const val = filledValues[f.id]
      if (!val || /^n\/?a$/i.test(val.trim()) || f.x == null || f.y == null) return
      const fx = (f.x / 100) * canvas.width
      const fy = (f.y / 100) * canvas.height
      const fw = (f.w / 100) * canvas.width
      const fieldH = (f.h / 100) * canvas.height

      if (f.type === 'checkbox') {
        const checked = /yes|true|x/i.test(val)
        if (!checked) return
        const checkSize = Math.round(Math.min(fw, fieldH) * 0.7)
        const cx = fx + fw / 2
        const cy = fy + fieldH / 2
        ctx.fillStyle = '#000000'
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = checkSize * 0.12
        ctx.font = `bold ${checkSize}px Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('✔', cx, cy)
        ctx.strokeText('✔', cx, cy)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
      } else {
        ctx.fillStyle = '#111111'
        const boxW = fw - 4
        const isMultiLine = fieldH > maxFontSize * 2.5

        if (isMultiLine) {
          // Tall field: wrap text across lines
          const fontSize = shrinkToFit(val, boxW * 3, maxFontSize) // allow wider before wrapping
          const lines = wrapWords(val, boxW)
          const lineH = fontSize * 1.4
          lines.forEach((ln, i) => {
            const lineY = fy + fontSize * 1.1 + i * lineH
            if (lineY < fy + fieldH) ctx.fillText(ln, fx + 2, lineY, boxW)
          })
        } else {
          // Single-line field: shrink font until text fits
          const fontSize = shrinkToFit(val, boxW, maxFontSize)
          ctx.fillText(val, fx + 2, fy + fontSize * 1.1, boxW)
        }
      }
    })
  }

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
        throw err
      }
    }
    return results
  }

  async function renderCanvases() {
    if (!fields.some(f => f.x != null)) return []
    const rendered = await renderPageCanvases()
    return rendered.map(({ canvas, pageNum }) => {
      overlayCanvas(canvas, pageNum)
      return { dataUrl: canvas.toDataURL('image/jpeg', 0.95), width: canvas.width, height: canvas.height }
    })
  }

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

  function snapFieldsToBoxes(rawFields, detectedBoxes) {
    if (!detectedBoxes.length) return rawFields
    return rawFields.map(f => {
      const fx = (f.x ?? 0) + (f.w ?? 0) / 2
      const fy = (f.y ?? 0) + (f.h ?? 0) / 2
      const pageBxs = detectedBoxes.filter(b => b.page === f.page && b.confidence >= 0.4)

      // Tier 1: Claude's centroid falls inside a detected box
      const containing = pageBxs.filter(b => fx >= b.x && fx <= b.x + b.w && fy >= b.y && fy <= b.y + b.h)
      if (containing.length > 0) {
        const best = containing.reduce((a, b) => b.confidence > a.confidence ? b : a)
        return { ...f, x: best.x, y: best.y, w: best.w, h: best.h, confidence: best.confidence, needsReview: false }
      }

      // Tier 2: nearest box within min(w,h)/4, confidence >= 0.4
      let best = null, bestDist = Infinity
      for (const b of pageBxs) {
        const dist = Math.hypot(fx - (b.x + b.w / 2), fy - (b.y + b.h / 2))
        if (dist < bestDist) { bestDist = dist; best = b }
      }
      if (best && bestDist < Math.min(best.w, best.h) / 4) {
        return { ...f, x: best.x, y: best.y, w: best.w, h: best.h, confidence: best.confidence, needsReview: false }
      }

      // Tier 3: no confident match — flag for review
      return { ...f, x: null, y: null, w: null, h: null, needsReview: true }
    })
  }

  async function buildVisualPdf() {
    const { jsPDF } = await import('jspdf')
    const pdfW = 210
    const rendered = await renderCanvases()
    if (!rendered.length) throw new Error('Could not render pages for visual export.')
    let doc = null
    rendered.forEach(({ dataUrl, width, height }, idx) => {
      const pdfH = (height / width) * pdfW
      if (idx === 0) doc = new jsPDF({ orientation: pdfH > pdfW ? 'portrait' : 'landscape', unit: 'mm', format: [pdfW, pdfH] })
      else doc.addPage([pdfW, pdfH], pdfH > pdfW ? 'portrait' : 'landscape')
      doc.addImage(dataUrl, 'JPEG', 0, 0, pdfW, pdfH)
    })
    return doc
  }

  async function buildSummaryPdf() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.setTextColor(0)
    doc.text('COMPLETED FORM', 105, 20, { align: 'center' })
    doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(120)
    doc.text(`Exported: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' })
    doc.setDrawColor(200); doc.line(15, 33, 195, 33)
    let y = 43; doc.setTextColor(0)
    fields.forEach(f => {
      const val = filledValues[f.id] || '(blank)'
      doc.setFont(undefined, 'bold'); doc.setFontSize(10)
      doc.text(`${f.label}:`, 15, y)
      doc.setFont(undefined, 'normal')
      const lines = doc.splitTextToSize(val, 115)
      doc.text(lines, 80, y)
      y += Math.max(8, lines.length * 6)
      if (y > 270) { doc.addPage(); y = 20 }
    })
    return doc
  }

  async function exportForm() {
    const p0 = pages[0]
    const isPdf = p0?.mime === 'application/pdf'

    // Fillable PDF: exact fill via pdf-lib, no preview needed
    if (isFillablePdf && isPdf && p0?.b64) {
      const valuesByFieldName = {}
      fields.forEach(f => { if (filledValues[f.id]) valuesByFieldName[f.pdfFieldName || f.id] = filledValues[f.id] })
      const filledBytes = await fillPdf(p0.b64, valuesByFieldName)
      const blob = new Blob([filledBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'completed_form.pdf'; a.click()
      URL.revokeObjectURL(url)
      return
    }

    // Block export if any field needs review — open preview so user can correct or override
    if (fields.some(f => f.needsReview)) {
      try {
        const raw = await renderRawPages()
        if (raw.length > 0) { setRawPageUrls(raw); setShowExportPreview(true); return }
      } catch (err) { console.error('Render failed:', err) }
    }

    // Flat PDF / image with coords: show interactive preview
    if (fields.some(f => f.x != null)) {
      try {
        const raw = await renderRawPages()
        if (raw.length > 0) { setRawPageUrls(raw); setShowExportPreview(true); return }
      } catch (err) { console.error('Render failed:', err) }
    }

    // No coords or render failed: summary PDF
    const doc = await buildSummaryPdf()
    doc.save('completed_form.pdf')
  }

  function omittedFilledFields() {
    return fields.filter(f => filledValues[f.id] && (f.needsReview || f.x == null))
  }

  async function downloadFromPreview() {
    const omitted = omittedFilledFields()
    if (omitted.length > 0) {
      const names = omitted.map(f => f.label).join(', ')
      if (!window.confirm(`Missing from PDF: ${names}\n\nDownload anyway?`)) return
    }
    try {
      const doc = await buildVisualPdf()
      doc.save('completed_form.pdf')
    } catch (err) {
      alert(`Export failed: ${err.message}`)
    } finally {
      setShowExportPreview(false)
      setRawPageUrls([])
    }
  }

  async function exportAnyway() {
    const omitted = omittedFilledFields()
    if (omitted.length > 0) {
      const names = omitted.map(f => f.label).join(', ')
      if (!window.confirm(`Missing from PDF: ${names}\n\nExport anyway?`)) return
    }
    try {
      const doc = await buildVisualPdf()
      doc.save('completed_form.pdf')
    } catch (err) {
      const doc = await buildSummaryPdf()
      doc.save('completed_form.pdf')
    } finally {
      setShowExportPreview(false)
      setRawPageUrls([])
    }
  }

  function clientXY(e) {
    return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY }
  }

  function handleDragStart(e, fieldId) {
    e.preventDefault()
    const container = e.currentTarget.parentElement
    const rect = container.getBoundingClientRect()
    const f = fields.find(f => f.id === fieldId)
    const { x, y } = clientXY(e)
    dragRef.current = { fieldId, containerRect: rect, startMouseX: x, startMouseY: y, startFx: f.x, startFy: f.y }
  }

  function handleDragMove(e) {
    if (!dragRef.current) return
    const { fieldId, containerRect, startMouseX, startMouseY, startFx, startFy } = dragRef.current
    const { x, y } = clientXY(e)
    const dx = ((x - startMouseX) / containerRect.width) * 100
    const dy = ((y - startMouseY) / containerRect.height) * 100
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, x: Math.max(0, startFx + dx), y: Math.max(0, startFy + dy) } : f))
  }

  function handleDragEnd() { dragRef.current = null }

  async function sendEmail() {
    if (!emailAddr.trim()) return
    const omitted = omittedFilledFields()
    if (omitted.length > 0) {
      const names = omitted.map(f => f.label).join(', ')
      if (!window.confirm(`Missing from emailed PDF: ${names}\n\nSend anyway? Cannot be undone.`)) return
    }
    setEmailSending(true)
    try {
      const p0 = pages[0]
      const isPdf = p0?.mime === 'application/pdf'
      let pdfBase64
      if (isFillablePdf && isPdf && p0?.b64) {
        const valuesByFieldName = {}
        fields.forEach(f => { if (filledValues[f.id]) valuesByFieldName[f.pdfFieldName || f.id] = filledValues[f.id] })
        const filledBytes = await fillPdf(p0.b64, valuesByFieldName)
        pdfBase64 = btoa(String.fromCharCode(...filledBytes))
      } else {
        const doc = await buildVisualPdf()
        pdfBase64 = doc.output('datauristring').split(',')[1]
      }
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailAddr.trim(), pdfBase64 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setShowEmailModal(false)
      setEmailAddr('')
      setMessages(m => [...m, { role: 'ai', text: `Form sent to ${emailAddr.trim()}!` }])
    } catch (err) {
      alert(`Email failed: ${err.message}`)
    }
    setEmailSending(false)
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

      <div style={s.main} className="main-grid">
        {/* LEFT */}
        <div style={s.card}>
          <div style={s.cardHdr}>
            📄 Form upload
          </div>

          {pages.length === 0 ? (
            <div
              style={{ ...s.dropZone, ...(isDrag ? s.dropZoneHover : {}) }}
              onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
              onDragLeave={() => setIsDrag(false)}
              onDrop={e => { e.preventDefault(); setIsDrag(false); e.dataTransfer.files.length > 0 && loadFiles(e.dataTransfer.files) }}
              onClick={() => fileRef.current?.click()}
            >
              <div style={{ fontSize: 32, color: '#bbb' }}>☁️</div>
              <p style={s.dropText}>Drop your form here<br />or click to browse</p>
              <small style={s.dropSub}>Supports JPG · PNG · PDF · Multiple pages</small>
            </div>
          ) : (
            <div style={{ ...s.previewBox, margin: 14 }}>
              <div style={s.previewTop}>
                <span>📎</span>
                <span style={s.previewFname}>{pages.length === 1 ? pages[0].name : `${pages.length} pages uploaded`}</span>
                <button style={s.rmBtn} onClick={() => resetAll()}>Remove</button>
              </div>
              {pages.map((p, i) => (
                <div key={i}>
                  {pages.length > 1 && <div style={{ fontSize: 10, color: '#999', padding: '3px 10px', background: '#fafafa', borderTop: '0.5px solid #eee' }}>Page {i + 1}</div>}
                  {p.previewSrc
                    ? <img src={p.previewSrc} alt={`Page ${i + 1}`} style={{ width: '100%', maxHeight: pages.length > 1 ? 110 : 220, objectFit: 'contain', background: '#f5f5f3' }} />
                    : <div style={s.pdfThumb}><span style={{ fontSize: 36 }}>📋</span><span>{p.name}</span><span style={{ fontSize: 11, color: '#bbb' }}>Ready to scan</span></div>
                  }
                </div>
              ))}
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*,.pdf" multiple style={{ display: 'none' }} onChange={e => e.target.files.length > 0 && loadFiles(e.target.files)} />

          <button
            style={(pages.length === 0 || scanning) ? s.scanBtnDisabled : s.scanBtn}
            disabled={pages.length === 0 || scanning}
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
              : <div ref={fieldsScrollRef} style={s.fieldsScroll} className="fields-scroll">
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

          <div style={s.chatCard} className="chat-card">
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

      <div style={s.bottomBar} className="bottom-bar">
        <div style={s.progTrack}><div style={{ ...s.progFill, width: pct + '%' }} /></div>
        <span style={s.progLbl}>{pct}% complete</span>
        <button style={filledCount === 0 ? s.expBtnDisabled : s.expBtn} onClick={exportForm} disabled={filledCount === 0}>
          Export as PDF
        </button>
        <button style={filledCount === 0 ? s.expBtnDisabled : s.emailBtn} onClick={() => setShowEmailModal(true)} disabled={filledCount === 0}>
          Email PDF
        </button>
      </div>

      {showExportPreview && (() => {
        const needsReviewFields = fields.filter(f => f.needsReview && filledValues[f.id])
        const omitted = fields.filter(f => filledValues[f.id] && !f.needsReview && (f.x == null || f.y == null))
        const lowConf = fields.filter(f => filledValues[f.id] && f.x != null && f.confidence != null && f.confidence < 0.5)
        const warnStyle = { fontSize: 12, color: '#7a4a00', background: '#FFF8E1', border: '0.5px solid #FFD54F', borderRadius: 6, padding: '7px 10px' }
        return (
          <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowExportPreview(false); setRawPageUrls([]) } }}>
            <div style={s.previewModal}>
              <div style={s.previewModalHdr}>Preview — verify field placement</div>
              {needsReviewFields.length > 0 && (
                <div style={{ ...warnStyle, color: '#7a0000', background: '#FFF0F0', border: '0.5px solid #FF8A80' }}>
                  ⚠ {needsReviewFields.length} field{needsReviewFields.length > 1 ? 's' : ''} could not be placed — drag to position or tap "Export anyway": {needsReviewFields.map(f => f.label).join(', ')}
                </div>
              )}
              {omitted.length > 0 && (
                <div style={{ ...warnStyle, marginTop: needsReviewFields.length > 0 ? 4 : 0 }}>
                  ⚠ {omitted.length} filled field{omitted.length > 1 ? 's' : ''} have no position data and will be <strong>missing</strong> from the PDF: {omitted.map(f => f.label).join(', ')}
                </div>
              )}
              {lowConf.length > 0 && (
                <div style={{ ...warnStyle, marginTop: omitted.length > 0 || needsReviewFields.length > 0 ? 4 : 0 }}>
                  ⚠ {lowConf.length} field{lowConf.length > 1 ? 's' : ''} have low-confidence placement — drag boxes to reposition: {lowConf.map(f => f.label).join(', ')}
                </div>
              )}
              {needsReviewFields.length === 0 && omitted.length === 0 && lowConf.length === 0 && (
                <div style={s.previewModalSub}>All fields placed. Drag any box to reposition. Click Download when ready.</div>
              )}
              <div style={s.previewImgWrap}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchMove={e => { e.preventDefault(); handleDragMove(e) }}
                onTouchEnd={handleDragEnd}
              >
                {rawPageUrls.map(({ dataUrl }, pageIdx) => {
                  const pageNum = pageIdx + 1
                  const pageFields = fields.filter(f =>
                    (f.page || 1) === pageNum && f.x != null && filledValues[f.id] && !/^n\/?a$/i.test(filledValues[f.id].trim())
                  )
                  return (
                    <div key={pageIdx} style={{ position: 'relative', width: '100%' }}>
                      <img src={dataUrl} alt={`Page ${pageIdx + 1}`} style={{ width: '100%', borderRadius: 4, display: 'block' }} />
                      {pageFields.map(f => (
                        <div key={f.id}
                          style={{
                            position: 'absolute',
                            left: `${f.x}%`, top: `${f.y}%`,
                            width: `${f.w}%`, height: `${f.h}%`,
                            border: `1.5px solid ${f.confidence != null && f.confidence < 0.5 ? '#FFB300' : '#1D9E75'}`,
                            background: 'rgba(29,158,117,0.10)',
                            cursor: 'move',
                            overflow: 'hidden', display: 'flex', alignItems: 'center',
                            padding: '0 2px', boxSizing: 'border-box', userSelect: 'none', touchAction: 'none',
                          }}
                          onMouseDown={e => handleDragStart(e, f.id)}
                          onTouchStart={e => handleDragStart(e, f.id)}
                        >
                          <span style={{ fontSize: '0.7vw', color: '#085041', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                            {f.type === 'checkbox' ? (/yes|true|x/i.test(filledValues[f.id]) ? '✔' : '') : filledValues[f.id]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
              <div style={s.modalRow}>
                <button style={s.modalCancel} onClick={() => { setShowExportPreview(false); setRawPageUrls([]) }}>Cancel</button>
                {needsReviewFields.length > 0 && (
                  <button style={{ ...s.modalCancel, color: '#7a4a00', borderColor: '#FFD54F' }} onClick={exportAnyway}>Export anyway</button>
                )}
                <button style={s.previewDlBtn} onClick={downloadFromPreview}>Download PDF</button>
              </div>
            </div>
          </div>
        )
      })()}

      {showEmailModal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowEmailModal(false) }}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Email completed form</div>
            <input
              style={s.modalInput}
              type="email"
              placeholder="your@email.com"
              value={emailAddr}
              onChange={e => setEmailAddr(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendEmail() }}
              autoFocus
            />
            <div style={s.modalRow}>
              <button style={s.modalCancel} onClick={() => { setShowEmailModal(false); setEmailAddr('') }}>Cancel</button>
              <button style={s.modalSend} onClick={sendEmail} disabled={emailSending}>
                {emailSending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
        button:hover { opacity: 0.88; }
        textarea:focus { border-color: #1D9E75 !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        @media (max-width: 768px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .fields-scroll { max-height: 240px !important; }
          .chat-card { min-height: 320px; }
          .bottom-bar { flex-wrap: wrap; gap: 8px; }
        }
      `}</style>
    </div>
  )
}
