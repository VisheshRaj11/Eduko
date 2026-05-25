// AITutor.jsx – Redesigned UI
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import { aiAPI, lessonAPI } from '../api/client'
import {
  FiSend,
  FiMic,
  FiVolume2,
  FiMessageSquare,
  FiUser,
  FiCpu,
  FiClock,
  FiBookOpen,
  FiHelpCircle,
  FiChevronLeft,
  FiMoreHorizontal,
  FiCheck,
  FiSquare,
  FiLoader,
} from 'react-icons/fi'

// Sample conversation history
const INITIAL_CONVERSATIONS = [
  { id: 1, title: 'Fractions explained', date: 'Today', preview: 'How to add fractions...' },
  { id: 2, title: 'Photosynthesis basics', date: 'Yesterday', preview: 'Plants need sunlight...' },
  { id: 3, title: 'Algebra equations', date: '2 days ago', preview: 'Solving for x...' },
]

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'ai',
    content: 'Hello! I\'m Eduko AI, your personal tutor. Ask me any school question — Math, Science, Hindi, English, and more! Try: "Explain photosynthesis" or "How do I solve fractions?"',
    timestamp: new Date(),
  },
]

const SUGGESTIONS = [
  'Explain photosynthesis',
  'Hindi grammar help',
  'Practice multiplication',
  'Science quiz',
]

export default function AITutor() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeConversation, setActiveConversation] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [language, setLanguage] = useState('en')       // 'en' | 'hi' | 'pa'
  const [subject, setSubject] = useState('')           // selected subject filter
  const [subjects, setSubjects] = useState([])         // subjects from ChromaDB
  const [lessons, setLessons] = useState([])           // uploaded lessons from DB
  const [selectedLessonId, setSelectedLessonId] = useState(null) // specific lesson filter
  const messagesEndRef = useRef(null)
  const _latestMessages = useRef(INITIAL_MESSAGES)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  // Load subjects from lessons in the database (always available)
  useEffect(() => {
    lessonAPI.list()
      .then(r => {
        const all = r.data?.data || r.data || []
        setLessons(all)
        // Extract unique subjects
        const unique = [...new Set(all.map(l => l.subject).filter(Boolean))]
        setSubjects(unique)
      })
      .catch(() => {
        setLessons([])
        setSubjects([])
      })
    // Also try ChromaDB subjects (may have more or be more accurate after ingestion)
    aiAPI.subjects()
      .then(data => {
        const chromaSubjects = data.subjects || []
        if (chromaSubjects.length > 0) setSubjects(chromaSubjects)
      })
      .catch(() => {})

    // Load Chat History
    aiAPI.getHistory()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const loadedMessages = [INITIAL_MESSAGES[0]]; // keep welcome message
          res.data.forEach(chat => {
            loadedMessages.push({
              id: chat._id + '_user',
              role: 'user',
              content: chat.message,
              timestamp: new Date(chat.created_at)
            });
            if (chat.response) {
              loadedMessages.push({
                id: chat._id + '_ai',
                role: 'ai',
                content: chat.response,
                timestamp: new Date(chat.created_at)
              });
            }
          });
          setMessages(loadedMessages);
          _latestMessages.current = loadedMessages;
        }
      })
      .catch(err => console.error("Failed to load chat history", err));
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text, forcedLanguage = null) => {
    if (!text.trim()) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    // Optimistically add user message
    setMessages(prev => {
      const updated = [...prev, userMessage]
      _latestMessages.current = updated
      return updated
    })
    setInputValue('')
    setIsTyping(true)

    try {
      // Build history array from current messages (exclude the welcome message)
      const history = _latestMessages.current
        .filter(m => m.id !== 1)
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))

      const res = await aiAPI.chat({
        message: text,
        language: forcedLanguage || language,
        subject: subject || null,
        lesson_id: selectedLessonId || null,
        history,
      })

      const reply = res.data?.response || res.data?.answer || res.data?.message || 'I received your message but got an unexpected response.'

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          content: reply,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      const errMsg =
        err?.response?.data?.response ||
        err?.response?.data?.message ||
        'Sorry, I could not reach the AI service right now. Please try again.'

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          content: errMsg,
          timestamp: new Date(),
          isError: true,
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true)
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())

        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.webm')

        try {
          const res = await aiAPI.speechToText(formData)
          if (res.data?.text) {
            let detectedLang = language
            if (res.data.language && ['en', 'hi', 'pa'].includes(res.data.language)) {
              detectedLang = res.data.language
              setLanguage(detectedLang)
            }
            sendMessage(res.data.text, detectedLang)
          }
        } catch (err) {
          console.error('Speech transcription failed:', err)
          setMessages(prev => [
            ...prev,
            { id: Date.now(), role: 'ai', content: 'Failed to transcribe audio. Please try again.', timestamp: new Date(), isError: true }
          ])
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Could not access microphone. Please allow microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const speakMessage = (text, lang) => {
    if (!window.speechSynthesis) {
      alert("Your browser does not support text-to-speech.");
      return;
    }
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = { 'en': 'en-IN', 'hi': 'hi-IN', 'pa': 'pa-IN' };
    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.9;

    // Try to find a native voice for the language if possible
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.startsWith(utterance.lang));
    if (targetVoice) utterance.voice = targetVoice;

    window.speechSynthesis.speak(utterance);
  }

  const handleSuggestion = (suggestion) => {
    sendMessage(suggestion)
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <AppLayout title={t('tutorTitle')} noRadial>
      <div
        style={{
          height: 'calc(100vh)',
          display: 'flex',
          gap: 0,
          background: '#F9FAFB',
          borderRadius: 32,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
          position: 'relative',
        }}
      >
        {/* ========= LEFT SIDEBAR (History) ========= */}
        <div
          className={`sidebar-conversations ${sidebarOpen ? 'open' : ''}`}
          style={{
            width: 300,
            background: 'white',
            borderRight: '1px solid #F0F0F0',
            transition: 'transform 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 20,
          }}
        >
          <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid #F0F0F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiMessageSquare size={20} color="white" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937', margin: 0 }}>
                {t('historyTitle')}
              </h3>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="mobile-close-sidebar"
              style={{
                display: 'none',
                width: '100%',
                padding: '10px',
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                color: '#4B5563',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t('closeSidebar')}
            </button>
          </div>


          {/* Scrollable body: History + Lessons */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* History section */}
            <div style={{ padding: '8px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px 10px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {t('recentChats')}
                </span>
              </div>
              {INITIAL_CONVERSATIONS.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: 20,
                    background: activeConversation === conv.id ? '#F8F5FF' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: 8,
                    transition: '0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (activeConversation !== conv.id) e.currentTarget.style.background = '#F9FAFB'
                  }}
                  onMouseLeave={(e) => {
                    if (activeConversation !== conv.id) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <FiBookOpen size={14} color="#8B5CF6" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                      {conv.title}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 6px 24px', lineHeight: 1.4 }}>
                    {conv.preview}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 24 }}>
                    <FiClock size={12} color="#9CA3AF" />
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{conv.date}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#F0F0F0', margin: '0 20px 0' }} />

            {/* ── Uploaded Lessons Section ── */}
            <div style={{ padding: '0 12px 12px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 8px 10px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#EC4899)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {t('uploadedLessons')}
              </span>
            </div>

            {lessons.length === 0 ? (
              <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#D1D5DB', fontStyle: 'italic', margin: 0 }}>
                  {t('noLessonsYet')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {lessons.map(lesson => (
                  <button
                    key={lesson._id || lesson.id}
                    onClick={() => {
                      setSubject('') // clear subject filter if we pick a specific lesson
                      setSelectedLessonId(lesson._id || lesson.id)
                      if (!inputValue) setInputValue(`Can you explain the main points of: ${lesson.title}?`)
                    }}
                    title={`Click to ask about: ${lesson.title}`}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: 16,
                      background: selectedLessonId === (lesson._id || lesson.id) ? '#F8F5FF' : '#FAFAFA',
                      border: selectedLessonId === (lesson._id || lesson.id) ? '1.5px solid #DDD6FE' : '1.5px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8F5FF'}
                    onMouseLeave={e => e.currentTarget.style.background = selectedLessonId === (lesson._id || lesson.id) ? '#F8F5FF' : '#FAFAFA'}
                  >
                    {/* Subject badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, #8B5CF620, #EC489920)',
                        color: '#8B5CF6',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>
                        {lesson.subject || 'General'}
                      </span>
                    </div>
                    {/* Title */}
                    <p style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1F2937',
                      margin: 0,
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {lesson.title}
                    </p>
                    {/* Hint */}
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiBookOpen size={10} /> {t('clickToAsk')}
                    </p>
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>{/* end scrollable body */}

          {/* Footer tip */}
          <div style={{ padding: '16px 20px 20px', borderTop: '1px solid #F0F0F0' }}>
            <div style={{ background: '#F8F5FF', borderRadius: 24, padding: '16px', textAlign: 'center' }}>
              <FiHelpCircle size={24} color="#8B5CF6" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: '#4B5563', margin: 0, fontWeight: 500 }}>
                {t('needHelpAsk')}
              </p>
            </div>
          </div>
        </div>

        {/* ========= RIGHT MAIN CHAT AREA ========= */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#F9FAFB',
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '20px 28px',
              background: 'white',
              borderBottom: '1px solid #F0F0F0',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-open-sidebar"
              style={{
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: 14,
                padding: 8,
                display: 'none',
                cursor: 'pointer',
              }}
            >
              <FiMessageSquare size={20} color="#8B5CF6" />
            </button>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                // background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(139,92,246,0.2)',
              }}
            >
              {/* <FiCpu size={24} color="white" /> */}
               <img src="./icon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1F2937', margin: 0 }}>
                {t('tutorTitle')}
              </h2>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCheck size={12} color="#10B981" />
                {t('alwaysReady')}
              </p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Language selector */}
              <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 40, padding: '4px 6px' }}>
                {[{ code: 'en', label: 'EN' }, { code: 'hi', label: 'हिं' }, { code: 'pa', label: 'ਪੰ' }].map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    title={code === 'en' ? 'English' : code === 'hi' ? 'Hindi' : 'Punjabi'}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 32,
                      fontSize: 12,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: language === code ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : 'transparent',
                      color: language === code ? 'white' : '#6B7280',
                      transition: 'all 0.2s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Online badge */}
              <div
                style={{
                  background: '#F3F4F6',
                  borderRadius: 40,
                  padding: '6px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 0 2px rgba(16,185,129,0.2)',
                  }}
                />
                {t('online')}
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '28px 28px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      display: 'flex',
                      gap: 12,
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        background:
                          msg.role === 'user'
                            ? 'linear-gradient(135deg, #8B5CF6, #EC4899)'
                            : '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: msg.role === 'user' ? '0 4px 12px rgba(139,92,246,0.2)' : 'none',
                      }}
                    >
                      {msg.role === 'user' ? (
                        <FiUser size={18} color="white" />
                      ) : (
                        <FiCpu size={18} color="#8B5CF6" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      style={{
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #8B5CF6, #EC4899)'
                          : 'white',
                        color: msg.role === 'user' ? 'white' : '#374151',
                        padding: '14px 20px',
                        borderRadius: 28,
                        borderTopRightRadius: msg.role === 'user' ? 8 : 28,
                        borderTopLeftRadius: msg.role === 'user' ? 28 : 8,
                        boxShadow: msg.role === 'ai' ? '0 4px 12px rgba(0,0,0,0.04)' : '0 6px 14px rgba(139,92,246,0.2)',
                        border: msg.role === 'ai' ? '1px solid #F0F0F0' : 'none',
                      }}
                    >
                      <div style={{
                        margin: 0,
                        fontSize: 15,
                        lineHeight: 1.5,
                        color: msg.isError
                          ? (msg.role === 'user' ? 'rgba(255,255,255,0.9)' : '#EF4444')
                          : 'inherit',
                      }}>
                        {msg.isError && msg.role === 'ai' ? '⚠️ ' : ''}
                        {msg.role === 'ai' && !msg.isError ? (
                          <div className="markdown-content">
                            <ReactMarkdown>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          marginTop: 8,
                          color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : '#9CA3AF',
                          display: 'flex',
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        {msg.role === 'ai' && !msg.isError ? (
                          <button
                            onClick={() => speakMessage(msg.content, language)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#9CA3AF',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title={t('speakListen')}
                          >
                            <FiVolume2 size={14} />
                            <span style={{ fontSize: 9 }}>{t('speakListen')}</span>
                          </button>
                        ) : <span />}
                        <div>{formatTime(msg.timestamp)}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', gap: 12, alignItems: 'center' }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    background: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FiCpu size={18} color="#8B5CF6" />
                </div>
                <div
                  style={{
                    background: 'white',
                    padding: '14px 24px',
                    borderRadius: 28,
                    border: '1px solid #F0F0F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        background: '#8B5CF6',
                        borderRadius: '50%',
                        animation: 'pulse 1.4s infinite',
                      }}
                    />
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        background: '#8B5CF6',
                        borderRadius: '50%',
                        animation: 'pulse 1.4s infinite 0.2s',
                      }}
                    />
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        background: '#8B5CF6',
                        borderRadius: '50%',
                        animation: 'pulse 1.4s infinite 0.4s',
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (only when conversation is fresh) */}
          {messages.length === 1 && !isTyping && (
            <div
              style={{
                padding: '8px 28px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'center',
              }}
            >
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(s)}
                  style={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: 40,
                    padding: '10px 22px',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#4B5563',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F3F4F6'
                    e.currentTarget.style.borderColor = '#8B5CF6'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.borderColor = '#E5E7EB'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '16px 28px 28px',
              background: '#F9FAFB',
            }}
          >
            {/* Subject Selector */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                📚 Ask about a subject
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {/* "All" pill — always shown */}
                <button
                  type="button"
                  onClick={() => { setSubject(''); setSelectedLessonId(null); }}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: !subject && !selectedLessonId ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : '#E5E7EB',
                    color: !subject && !selectedLessonId ? 'white' : '#6B7280',
                    transition: 'all 0.2s',
                  }}
                >
                  🌐 All Subjects
                </button>
                {subjects.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setSubject(s === subject ? '' : s); setSelectedLessonId(null); }}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: subject === s ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : '#E5E7EB',
                      color: subject === s ? 'white' : '#6B7280',
                      transition: 'all 0.2s',
                    }}
                  >
                    {s}
                  </button>
                ))}
                {subjects.length === 0 && (
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                    Upload a lesson as teacher to see subjects here
                  </span>
                )}
              </div>
              {selectedLessonId && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#8B5CF6', background: '#F8F5FF', padding: '4px 10px', borderRadius: 12, border: '1px solid #DDD6FE' }}>
                    ✅ AI will focus strictly on the document: <strong>{lessons.find(l => (l._id || l.id) === selectedLessonId)?.title || 'Selected Lesson'}</strong>
                  </span>
                  <button type="button" onClick={() => setSelectedLessonId(null)} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                    Clear
                  </button>
                </div>
              )}
              {subject && !selectedLessonId && (
                <p style={{ fontSize: 11, color: '#8B5CF6', marginTop: 6 }}>
                  ✅ AI will focus on <strong>{subject}</strong> lessons
                </p>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'white',
                borderRadius: 80,
                padding: '8px 8px 8px 24px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                transition: 'box-shadow 0.2s',
              }}
              onFocus={() => {}}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={subject ? `Ask about ${subject}...` : 'Ask any school question...'}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '12px 0',
                  fontSize: 15,
                  outline: 'none',
                  color: '#374151',
                }}
              />
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing || isTyping}
                title={isRecording ? "Stop Recording" : "Speak your question"}
                style={{
                  background: isRecording ? '#EF4444' : '#F3F4F6',
                  border: 'none',
                  borderRadius: 40,
                  color: isRecording ? 'white' : '#8B5CF6',
                  cursor: (isTranscribing || isTyping) ? 'not-allowed' : 'pointer',
                  padding: 10,
                  display: 'flex',
                  alignItems: 'center',
                  transition: '0.2s',
                  opacity: (isTranscribing || isTyping) ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { if (!isRecording) e.currentTarget.style.background = '#E5E7EB' }}
                onMouseLeave={(e) => { if (!isRecording) e.currentTarget.style.background = '#F3F4F6' }}
              >
                {isTranscribing ? (
                  <FiLoader size={20} className="animate-spin" />
                ) : isRecording ? (
                  <FiSquare size={20} className="animate-pulse" />
                ) : (
                  <FiMic size={20} />
                )}
              </button>
              <button
                type="button"
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 40,
                  color: '#8B5CF6',
                  cursor: 'pointer',
                  padding: 10,
                  display: 'flex',
                  alignItems: 'center',
                  transition: '0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
              >
                <FiVolume2 size={20} />
              </button>
              <button
                type="submit"
                disabled={!inputValue.trim()}
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  border: 'none',
                  borderRadius: 50,
                  padding: '10px 28px',
                  color: 'white',
                  cursor: !inputValue.trim() ? 'not-allowed' : 'pointer',
                  opacity: !inputValue.trim() ? 0.5 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                }}
              >
                <FiSend size={16} />
                Send
              </button>
            </div>
            <p
              style={{
                fontSize: 12,
                color: '#6B7280',
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              Voice input available • Supports Hindi, Punjabi, English
            </p>
          </form>
        </div>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-conversations {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: 85%;
            max-width: 300px;
            z-index: 100;
            transform: translateX(-100%);
            box-shadow: 2px 0 20px rgba(0,0,0,0.1);
            border-radius: 0;
          }
          .sidebar-conversations.open {
            transform: translateX(0);
          }
          .mobile-open-sidebar {
            display: flex !important;
          }
          .mobile-close-sidebar {
            display: block !important;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </AppLayout>
  )
}