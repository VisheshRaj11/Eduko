import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { aiAPI } from '../api/client'
import useStore from '../store/useStore'
import {
  FiSend, FiMic, FiMicOff, FiCamera, FiGlobe, FiRefreshCw,
  FiVolume2, FiVolumeX, FiDownload, FiCopy, FiCheck,
} from 'react-icons/fi'

const LANG_OPTIONS = [
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', flag: '🟡' },
  { code: 'en', label: 'English', flag: '🌐' },
]

const SUGGESTIONS = [
  'What is photosynthesis? Explain simply.',
  'Help me solve: 3x + 5 = 20',
  'What causes seasons on Earth?',
  'Explain fractions with an example.',
]

function TypingDots() {
  return (
    <div className="flex gap-1.5 py-1 px-2">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-2 h-2 rounded-full bg-purple-400"
          animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
      ))}
    </div>
  )
}

function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copyText = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const speakText = () => {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(msg.content)
      utter.lang = msg.language === 'hi' ? 'hi-IN' : msg.language === 'pa' ? 'pa-IN' : 'en-US'
      window.speechSynthesis.speak(utter)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
        ${isUser ? 'bg-purple-600 text-white' : 'bg-gradient-to-br from-violet-500 to-purple-700 text-white'}`}>
        {isUser ? '👤' : '🤖'}
      </div>

      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
          ${isUser
            ? 'bg-gradient-to-br from-purple-600 to-violet-700 text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
          {msg.content}
        </div>
        {/* Actions on AI messages */}
        {!isUser && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={speakText} title="Speak"
              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600 transition-colors">
              <FiVolume2 size={13} />
            </button>
            <button onClick={copyText} title="Copy"
              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600 transition-colors">
              {copied ? <FiCheck size={13} className="text-green-600" /> : <FiCopy size={13} />}
            </button>
          </div>
        )}
        <span className="text-xs text-slate-400 px-1">
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}

export default function ChatUI() {
  const { chatMessages, addChatMessage, clearChat, chatLanguage, setChatLanguage, user, isOnline } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const bottomRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const fileInputRef = useRef(null)
  const textAreaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, loading])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text.trim(), ts: Date.now(), language: chatLanguage }
    addChatMessage(userMsg)
    setInput('')
    setLoading(true)

    const history = chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content }))

    try {
      const { data } = await aiAPI.chat({
        message: text.trim(),
        language: chatLanguage,
        user_id: user?._id || 'anonymous',
        history,
      })
      addChatMessage({ role: 'assistant', content: data.response, ts: Date.now(), language: chatLanguage })
    } catch (err) {
      addChatMessage({
        role: 'assistant',
        content: isOnline
          ? '⚠️ Sorry, I had trouble connecting. Please try again.'
          : '📴 You appear to be offline. I can only answer from cached lessons.',
        ts: Date.now(), language: 'en',
      })
    } finally {
      setLoading(false)
    }
  }, [input, loading, chatMessages, chatLanguage, user, isOnline, addChatMessage])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  // ── Voice Recording ───────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())
        await sendAudioToAPI(blob)
      }
      mediaRecorder.start()
      setRecording(true)
    } catch {
      alert('Microphone access denied. Please allow microphone access.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const sendAudioToAPI = async (blob) => {
    setLoading(true)
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')
    formData.append('language_hint', chatLanguage)
    try {
      const { data } = await aiAPI.speechToText(formData)
      if (data.text) {
        setInput(data.text)
        textAreaRef.current?.focus()
      }
    } catch {
      addChatMessage({ role: 'assistant', content: '🎤 Sorry, could not transcribe audio. Please type your question.', ts: Date.now(), language: 'en' })
    } finally {
      setLoading(false)
    }
  }

  // ── OCR ───────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    const formData = new FormData()
    formData.append('image', file)
    try {
      const { data } = await aiAPI.ocr(formData)
      const extractedText = data.text || ''
      addChatMessage({ role: 'user', content: `📷 [Handwritten work scanned]\n\n${extractedText}`, ts: Date.now(), language: chatLanguage })
      await sendMessage(extractedText)
    } catch {
      addChatMessage({ role: 'assistant', content: '📷 Could not read the image. Please try again with a clearer photo.', ts: Date.now(), language: 'en' })
    } finally {
      setOcrLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF5' }}>
      {/* ── Header ── */}
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid #E8E3F0',
        background: 'linear-gradient(135deg, #F8F5FF 0%, #FAFAF5 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E' }}>Eduko AI Tutor</div>
            <div style={{ fontSize: 11, color: '#8B5CF6' }}>
              {loading ? 'Typing...' : 'Ask me anything in any language'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Language Picker */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowLangPicker(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 8, border: '1.5px solid #E8E3F0', background: 'white',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#7C3AED',
              }}>
              <FiGlobe size={14} />
              {LANG_OPTIONS.find(l => l.code === chatLanguage)?.label}
            </button>
            <AnimatePresence>
              {showLangPicker && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  style={{
                    position: 'absolute', top: '110%', right: 0, background: 'white',
                    borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid #E8E3F0', zIndex: 50, overflow: 'hidden', minWidth: 120,
                  }}>
                  {LANG_OPTIONS.map(l => (
                    <button key={l.code}
                      onClick={() => { setChatLanguage(l.code); setShowLangPicker(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '10px 14px', border: 'none', cursor: 'pointer',
                        background: chatLanguage === l.code ? '#F3F0FF' : 'transparent',
                        color: chatLanguage === l.code ? '#7C3AED' : '#374151',
                        fontWeight: chatLanguage === l.code ? 700 : 500, fontSize: 13,
                      }}>
                      <span>{l.flag}</span> {l.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={clearChat} title="Clear chat"
            style={{ padding: 8, borderRadius: 8, border: '1.5px solid #E8E3F0', background: 'white', cursor: 'pointer', color: '#94A3B8' }}>
            <FiRefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {chatMessages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
            <h3 style={{ fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Namaste! I'm your AI Tutor</h3>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>
              Ask me anything in Hindi, Punjabi or English!<br />
              You can also speak 🎤 or upload a photo 📷 of your work.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  style={{
                    padding: '8px 14px', borderRadius: 20, border: '1.5px solid #D8D0F0',
                    background: '#F8F5FF', color: '#7C3AED', fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = '#EDE9FE'}
                  onMouseLeave={e => e.target.style.background = '#F8F5FF'}>
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {chatMessages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
            <div style={{ background: 'white', border: '1px solid #E8E3F0', borderRadius: 16, borderTopLeftRadius: 4, padding: '8px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ── */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #E8E3F0', background: 'white' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#F8F5FF', borderRadius: 16, border: '2px solid #E8E3F0', padding: '8px 12px', transition: 'border-color 0.2s' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = '#8B5CF6'}
          onBlurCapture={e => e.currentTarget.style.borderColor = '#E8E3F0'}>

          {/* OCR button */}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={ocrLoading}
            title="Scan handwritten work"
            style={{ padding: 8, borderRadius: 10, border: 'none', background: ocrLoading ? '#F3F0FF' : 'transparent', cursor: 'pointer', color: '#8B5CF6', flexShrink: 0 }}>
            {ocrLoading ? <FiRefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <FiCamera size={18} />}
          </button>

          {/* Text area */}
          <textarea ref={textAreaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type in ${LANG_OPTIONS.find(l => l.code === chatLanguage)?.label || 'any language'}... (Enter to send, Shift+Enter for newline)`}
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              resize: 'none', fontSize: 14, fontFamily: 'Outfit, Noto Sans, sans-serif',
              color: '#1A1A2E', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
              minHeight: 24, paddingTop: 4,
            }}
          />

          {/* Voice button */}
          <button
            onClick={recording ? stopRecording : startRecording}
            title={recording ? 'Stop recording' : 'Speak your question'}
            style={{
              padding: 8, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: recording ? '#EF4444' : 'transparent',
              color: recording ? 'white' : '#8B5CF6',
              animation: recording ? 'pulse 1s infinite' : 'none',
            }}>
            {recording ? <FiMicOff size={18} /> : <FiMic size={18} />}
          </button>

          {/* Send button */}
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: input.trim() && !loading ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : '#E2E8F0',
              color: input.trim() && !loading ? 'white' : '#94A3B8',
              transition: 'all 0.2s',
            }}>
            <FiSend size={16} />
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
          Powered by Gemini 2.5 Flash · RAG-enhanced with your course materials
        </div>
      </div>
    </div>
  )
}
