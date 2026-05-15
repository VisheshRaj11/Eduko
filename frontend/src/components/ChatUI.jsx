import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { aiAPI } from '../api/client'
import useStore from '../store/useStore'
import {
  FiSend, FiMic, FiImage, FiZap, FiGlobe,
  FiUser, FiCpu, FiX
} from 'react-icons/fi'

export default function ChatUI() {
  const { t, i18n } = useTranslation()
  const { chatMessages, addChatMessage } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const bottomRef = useRef(null)
  const fileRef = useRef(null)
  const mediaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, loading])

  const sendMessage = async (text, extra = {}) => {
    if (!text.trim() && !extra.image) return
    const userMsg = { role: 'user', content: text || '📷 Image uploaded', timestamp: new Date() }
    addChatMessage(userMsg)
    setInput('')
    setLoading(true)

    try {
      const { data } = await aiAPI.chat({
        message: text,
        language: i18n.language,
        history: chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        ...extra,
      })
      addChatMessage({ role: 'ai', content: data.response, timestamp: new Date() })
    } catch {
      addChatMessage({ role: 'ai', content: '⚠ Sorry, I could not process your request. Please try again.', timestamp: new Date() })
    } finally {
      setLoading(false)
    }
  }

  const handleSimplify = () => {
    if (chatMessages.length === 0) return
    const last = [...chatMessages].reverse().find(m => m.role === 'ai')
    if (last) sendMessage(`Please simplify this: ${last.content}`)
  }

  const handleTranslate = () => {
    if (chatMessages.length === 0) return
    const last = [...chatMessages].reverse().find(m => m.role === 'ai')
    const targetLang = i18n.language === 'en' ? 'Hindi' : 'English'
    if (last) sendMessage(`Translate to ${targetLang}: ${last.content}`)
  }

  const handleVoice = async () => {
    if (recording) {
      mediaRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []
      recorder.ondataavailable = e => chunks.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const fd = new FormData()
        fd.append('audio', blob, 'recording.webm')
        fd.append('language', i18n.language)
        try {
          const { data } = await aiAPI.speechToText(fd)
          if (data.text) setInput(data.text)
        } catch { /* silent */ }
      }
      recorder.start()
      mediaRef.current = recorder
      setRecording(true)
      setTimeout(() => { recorder.state === 'recording' && recorder.stop(); setRecording(false) }, 10000)
    } catch { alert('Microphone access denied.') }
  }

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('image', file)
    try {
      setLoading(true)
      const { data } = await aiAPI.ocr(fd)
      if (data.text) sendMessage(`[Image text]: ${data.text}`)
    } catch { sendMessage('', { image: true }) }
    finally { setLoading(false); e.target.value = '' }
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
              <FiCpu size={36} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">{t('tutorTitle')}</h3>
            <p className="text-slate-500 text-sm max-w-xs">{t('tutorSubtitle')}</p>
            <div className="grid grid-cols-1 gap-2 mt-6 w-full max-w-xs">
              {['What is photosynthesis?', 'Help me with math fractions', 'Tell me about the water cycle'].map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-left px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-700 border border-slate-200 hover:border-primary-200 text-sm text-slate-600 transition-all">
                  💡 {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {chatMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-accent-100 text-accent-600'}`}>
                {msg.role === 'user' ? <FiUser size={14} /> : <FiCpu size={14} />}
              </div>
              <div className={`chat-bubble ${msg.role}`}>{msg.content}</div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center">
              <FiCpu size={14} className="text-accent-600" />
            </div>
            <div className="chat-bubble ai flex items-center gap-1.5">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-2 flex gap-2 flex-wrap">
        <button onClick={handleSimplify} className="btn btn-sm btn-secondary gap-1">
          <FiZap size={13} /> {t('simplify')}
        </button>
        <button onClick={handleTranslate} className="btn btn-sm btn-secondary gap-1">
          <FiGlobe size={13} /> {t('translate')}
        </button>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex items-center gap-2 border-2 border-slate-200 focus-within:border-primary-500 rounded-xl px-3 py-2 transition-colors bg-slate-50">
            <textarea
              className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 placeholder-slate-400 max-h-32"
              placeholder={t('typeMessage')}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              rows={1}
              style={{ minHeight: 24 }}
            />
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <button onClick={() => fileRef.current?.click()} className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors" title={t('uploadImage')}>
                <FiImage size={17} />
              </button>
              <button
                onClick={handleVoice}
                className={`p-1.5 transition-colors ${recording ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-primary-600'}`}
                title={t('voiceInput')}
              >
                <FiMic size={17} />
              </button>
            </div>
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="btn btn-primary p-3 rounded-xl"
          >
            <FiSend size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
