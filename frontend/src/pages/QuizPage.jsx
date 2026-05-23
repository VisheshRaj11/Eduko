import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import api, { studentAPI, quizAPI } from '../api/client'
import {
  FiCheck,
  FiX,
  FiAward,
  FiArrowRight,
  FiBookOpen,
  FiSettings,
  FiCheckCircle,
  FiLoader,
  FiActivity,
  FiRefreshCcw,
} from 'react-icons/fi'

const DEMO_QUIZ = {
  _id: 'q1',
  lesson_id: '1',
  title: 'Mathematics: Fractions Quiz',
  questions: [
    { _id: 'q1', text: 'What is 1/2 + 1/4?', options: ['1/2', '3/4', '1/6', '2/6'], correct: 1 },
    { _id: 'q2', text: 'Which fraction is equivalent to 2/4?', options: ['1/4', '3/4', '1/2', '4/8'], correct: 2 },
    { _id: 'q3', text: 'What is 3/5 of 20?', options: ['10', '12', '15', '8'], correct: 1 },
    { _id: 'q4', text: 'Simplify 6/8', options: ['2/3', '3/4', '4/6', '1/2'], correct: 1 },
    { _id: 'q5', text: 'Which is greater: 2/3 or 3/5?', options: ['2/3', '3/5', 'They are equal', 'Cannot determine'], correct: 0 },
  ],
}

export default function QuizPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('assigned') // 'assigned' or 'ai'

  // --- Assigned Quiz State ---
  const [quiz, setQuiz] = useState(null)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // --- AI Quiz State ---
  const [aiStep, setAiStep] = useState('setup')
  const [formData, setFormData] = useState({
    subject: 'Science',
    count: 3,
    type: 'mcq',
    difficulty: 'medium',
    prompt: '',
  })
  const [aiQuestions, setAiQuestions] = useState([])
  const [aiAnswers, setAiAnswers] = useState({})
  const [evaluation, setEvaluation] = useState(null)
  const [aiError, setAiError] = useState('')
  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Punjabi']

  useEffect(() => {
    quizAPI
      .getByLesson('1')
      .then((r) => setQuiz(r.data))
      .catch(() => setQuiz(DEMO_QUIZ))
      .finally(() => setLoading(false))
  }, [])

  // --- Assigned Quiz Handlers ---
  const handleSelect = (idx) => {
    if (selected !== null) return
    setSelected(idx)
    const correct = quiz.questions[current].correct === idx
    const newAnswers = [...answers, { questionIdx: current, selected: idx, correct }]
    setAnswers(newAnswers)

    setTimeout(() => {
      if (current + 1 < quiz.questions.length) {
        setCurrent((c) => c + 1)
        setSelected(null)
      } else {
        submitQuiz(newAnswers)
      }
    }, 1000)
  }

  const submitQuiz = async (finalAnswers) => {
    setSubmitting(true)
    const score = Math.round(
      (finalAnswers.filter((a) => a.correct).length / quiz.questions.length) * 100
    )
    try {
      await studentAPI.submitQuiz({ quiz_id: quiz._id, score, answers: finalAnswers })
    } catch {
      /* offline — save to sync queue */
    }
    setDone(true)
    setSubmitting(false)
  }

  const score = answers.filter((a) => a.correct).length
  const total = quiz?.questions?.length || 0

  // --- AI Quiz Handlers ---
  const handleGenerateAI = async (e) => {
    e.preventDefault()
    setAiStep('loading')
    setAiError('')
    try {
      const res = await api.post('/ai-quiz/generate', formData)
      if (res.data && res.data.questions) {
        setAiQuestions(res.data.questions)
        setAiStep('playing')
        setAiAnswers({})
      } else {
        throw new Error('Invalid quiz data received')
      }
    } catch (err) {
      setAiError('Failed to generate quiz. Please try again.')
      setAiStep('setup')
    }
  }

  const handleSubmitAIQuiz = async () => {
    setAiStep('evaluating')
    setAiError('')
    const qa_pairs = aiQuestions.map((q, idx) => ({
      question: q.question,
      answer: aiAnswers[idx] || '',
      correct_answer: q.answer || '',
    }))
    try {
      const res = await api.post('/ai-quiz/evaluate', {
        subject: formData.subject,
        type: formData.type,
        qa_pairs,
      })
      setEvaluation(res.data)
      setAiStep('results')
    } catch (err) {
      setAiError('Failed to evaluate quiz. Please try again.')
      setAiStep('playing')
    }
  }

  const getRatingColor = (rating) => {
    switch (rating?.toLowerCase()) {
      case 'good':
        return { background: '#F0FDF4', color: '#166534', border: '#10B981' }
      case 'weak':
        return { background: '#FEF2F2', color: '#991B1B', border: '#EF4444' }
      default:
        return { background: '#FFFBEB', color: '#92400E', border: '#F59E0B' }
    }
  }

  // --- Render Assigned Quiz ---
  const renderAssignedQuiz = () => {
    if (loading) {
      return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
          <div
            style={{
              background: 'white',
              borderRadius: 28,
              padding: '32px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                height: 8,
                background: '#E2E8F0',
                borderRadius: 4,
                marginBottom: 24,
                width: '30%',
              }}
            />
            <div
              style={{
                height: 60,
                background: '#F1F5F9',
                borderRadius: 16,
                marginBottom: 20,
              }}
            />
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: 56,
                  background: '#F8FAFC',
                  borderRadius: 16,
                  marginBottom: 12,
                }}
              />
            ))}
          </div>
        </div>
      )
    }

    if (done) {
      const percent = Math.round((score / total) * 100)
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 500,
            padding: '40px 24px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              maxWidth: 480,
              width: '100%',
              background: 'white',
              borderRadius: 40,
              padding: '40px 32px',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
              boxShadow: '0 20px 35px -12px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                background: score >= total * 0.7 ? '#10B981' : '#F59E0B',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiAward size={40} color="white" />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {t('quizComplete')}
            </h2>
            <p style={{ color: '#64748B', marginBottom: 24, marginTop: 8 }}>{t('youScored')}</p>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              {score}/{total}
            </div>
            <div style={{ fontSize: 16, color: '#475569', marginBottom: 32 }}>{percent}% {t('correct')}</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: 12,
                marginBottom: 32,
              }}
            >
              {answers.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 16,
                    background: a.correct ? '#F0FDF4' : '#FEF2F2',
                    color: a.correct ? '#166534' : '#991B1B',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {a.correct ? <FiCheck size={14} /> : <FiX size={14} />} Q{i + 1}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setCurrent(0)
                setSelected(null)
                setAnswers([])
                setDone(false)
              }}
              style={{
                width: '100%',
                background: '#3B82F6',
                color: 'white',
                padding: '14px 24px',
                borderRadius: 40,
                fontWeight: 600,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2563EB')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#3B82F6')}
            >
              <FiArrowRight size={18} /> {t('tryAgain')}
            </button>
          </motion.div>
        </div>
      )
    }

    const q = quiz?.questions?.[current]
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
            Question {current + 1} of {total}
          </span>
          <div
            style={{
              background: '#EFF6FF',
              color: '#2563EB',
              padding: '4px 12px',
              borderRadius: 40,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {quiz?.title}
          </div>
        </div>
        <div
          style={{
            width: '100%',
            height: 6,
            background: '#E2E8F0',
            borderRadius: 3,
            marginBottom: 32,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(current / total) * 100}%`,
              height: '100%',
              background: '#3B82F6',
              borderRadius: 3,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            style={{
              background: 'white',
              borderRadius: 32,
              padding: '32px 28px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#2563EB',
                }}
              >
                {current + 1}
              </div>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#0F172A',
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {q?.text}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {q?.options?.map((opt, i) => {
                const isCorrect = i === q.correct
                const isSelected = i === selected
                const isWrongSelected = isSelected && !isCorrect
                let background = 'white'
                let borderColor = '#E2E8F0'
                let textColor = '#334155'

                if (selected !== null && isCorrect) {
                  background = '#F0FDF4'
                  borderColor = '#10B981'
                  textColor = '#166534'
                } else if (selected !== null && isWrongSelected) {
                  background = '#FEF2F2'
                  borderColor = '#EF4444'
                  textColor = '#991B1B'
                } else if (selected !== null && !isCorrect && !isSelected) {
                  background = '#F8FAFC'
                  borderColor = '#E2E8F0'
                  textColor = '#94A3B8'
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '14px 20px',
                      borderRadius: 24,
                      border: `2px solid ${borderColor}`,
                      background,
                      cursor: selected !== null ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      if (selected === null && !isCorrect && !isSelected) {
                        e.currentTarget.style.borderColor = '#3B82F6'
                        e.currentTarget.style.background = '#EFF6FF'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selected === null && !isCorrect && !isSelected) {
                        e.currentTarget.style.borderColor = '#E2E8F0'
                        e.currentTarget.style.background = 'white'
                      }
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        border: `2px solid ${
                          selected !== null && isCorrect
                            ? '#10B981'
                            : selected !== null && isWrongSelected
                            ? '#EF4444'
                            : '#CBD5E1'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        color:
                          selected !== null && isCorrect
                            ? '#10B981'
                            : selected !== null && isWrongSelected
                            ? '#EF4444'
                            : '#64748B',
                        flexShrink: 0,
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: textColor }}>
                      {opt}
                    </span>
                    {selected !== null && isCorrect && <FiCheck size={20} color="#10B981" />}
                    {selected !== null && isWrongSelected && <FiX size={20} color="#EF4444" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // --- Render AI Quiz ---
  const renderAIQuiz = () => {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {aiError && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 20,
              padding: '14px 18px',
              marginBottom: 24,
              color: '#B91C1C',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span>⚠️</span>
            <span>{aiError}</span>
          </div>
        )}

        {aiStep === 'setup' && (
          <div
            style={{
              background: 'white',
              borderRadius: 32,
              padding: '32px 28px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiActivity size={24} color="#2563EB" />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  {t('quizCustom')}
                </h1>
                <p style={{ fontSize: 14, color: '#64748B' }}>
                  {t('generateCustomQuiz')}
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateAI}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1E293B',
                      marginBottom: 8,
                    }}
                  >
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 16,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1E293B',
                      marginBottom: 8,
                    }}
                  >
                    {t('numCards')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.count}
                    onChange={(e) =>
                      setFormData({ ...formData, count: parseInt(e.target.value) })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 16,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1E293B',
                      marginBottom: 8,
                    }}
                  >
                    {t('questionType')}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 16,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  >
                    <option value="mcq">{t('mcq')}</option>
                    <option value="subjective">{t('subjective')}</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1E293B',
                      marginBottom: 8,
                    }}
                  >
                    {t('difficulty')}
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 16,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  >
                    <option value="easy">{t('easy')}</option>
                    <option value="medium">{t('medium')}</option>
                    <option value="hard">{t('hard')}</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1E293B',
                    marginBottom: 8,
                  }}
                >
                  {t('topicOptional')}
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder={t('topicOptionalPlaceholder')}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    fontSize: 14,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: 24,
                }}
              >
                <button
                  type="submit"
                  style={{
                    background: '#3B82F6',
                    color: 'white',
                    padding: '12px 28px',
                    borderRadius: 40,
                    fontWeight: 600,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#2563EB')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#3B82F6')}
                >
                  <FiSettings size={16} /> {t('generateQuiz')}
                </button>
              </div>
            </form>
          </div>
        )}

        {(aiStep === 'loading' || aiStep === 'evaluating') && (
          <div
            style={{
              background: 'white',
              borderRadius: 32,
              padding: '60px 32px',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 24px',
                border: '3px solid #E2E8F0',
                borderTopColor: '#3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              {aiStep === 'loading' ? t('craftingQuiz') : t('evaluatingQuiz')}
            </h3>
            <p style={{ fontSize: 14, color: '#64748B' }}>
              {t('aiAnalyzing')}
            </p>
          </div>
        )}

        {aiStep === 'playing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {aiQuestions.map((q, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  borderRadius: 28,
                  padding: '24px 28px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <h4
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: 20,
                  }}
                >
                  <span style={{ color: '#3B82F6', marginRight: 10 }}>Q{idx + 1}.</span>
                  {q.question}
                </h4>
                {formData.type === 'mcq' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {q.options?.map((opt, oidx) => (
                      <label
                        key={oidx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 16px',
                          borderRadius: 20,
                          border: `1px solid ${
                            aiAnswers[idx] === opt ? '#3B82F6' : '#E2E8F0'
                          }`,
                          background: aiAnswers[idx] === opt ? '#EFF6FF' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="radio"
                          name={`ai-q-${idx}`}
                          value={opt}
                          checked={aiAnswers[idx] === opt}
                          onChange={(e) =>
                            setAiAnswers({ ...aiAnswers, [idx]: e.target.value })
                          }
                          style={{ width: 16, height: 16 }}
                        />
                        <span style={{ fontSize: 14, color: '#1E293B' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    value={aiAnswers[idx] || ''}
                    onChange={(e) => setAiAnswers({ ...aiAnswers, [idx]: e.target.value })}
                    placeholder="Type your answer here..."
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 20,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      fontSize: 14,
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                )}
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                position: 'sticky',
                bottom: 20,
                zIndex: 10,
              }}
            >
              <button
                onClick={handleSubmitAIQuiz}
                disabled={Object.keys(aiAnswers).length < aiQuestions.length}
                style={{
                  background: '#3B82F6',
                  color: 'white',
                  padding: '12px 32px',
                  borderRadius: 40,
                  fontWeight: 600,
                  fontSize: 15,
                  border: 'none',
                  cursor: Object.keys(aiAnswers).length < aiQuestions.length ? 'not-allowed' : 'pointer',
                  opacity: Object.keys(aiAnswers).length < aiQuestions.length ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (Object.keys(aiAnswers).length >= aiQuestions.length) {
                    e.currentTarget.style.background = '#2563EB'
                  }
                }}
                onMouseLeave={(e) => {
                  if (Object.keys(aiAnswers).length >= aiQuestions.length) {
                    e.currentTarget.style.background = '#3B82F6'
                  }
                }}
              >
                <FiCheckCircle size={18} /> {t('submitAnswers')}
              </button>
            </div>
          </div>
        )}

        {aiStep === 'results' && evaluation && (
          <div
            style={{
              background: 'white',
              borderRadius: 32,
              padding: '40px 32px',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
              Quiz Complete!
            </h2>
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: '#2563EB',
                marginBottom: 24,
              }}
            >
              {evaluation.score}%
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 18px',
                  borderRadius: 40,
                  background: getRatingColor(evaluation.rating).background,
                  color: getRatingColor(evaluation.rating).color,
                  border: `1px solid ${getRatingColor(evaluation.rating).border}`,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <FiActivity size={16} /> Performance: {evaluation.rating}
              </div>
            </div>
            <p
              style={{
                fontSize: 16,
                color: '#475569',
                maxWidth: 500,
                margin: '0 auto 32px',
                lineHeight: 1.6,
              }}
            >
              {evaluation.feedback}
            </p>
            <button
              onClick={() => setAiStep('setup')}
              style={{
                background: 'white',
                color: '#3B82F6',
                padding: '12px 28px',
                borderRadius: 40,
                fontWeight: 600,
                fontSize: 14,
                border: '1px solid #3B82F6',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EFF6FF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
              }}
            >
              <FiRefreshCcw size={18} /> {t('newSet')}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <AppLayout title={t('quizzes')}>
      <div
        style={{
          borderBottom: '1px solid #E2E8F0',
          background: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            gap: 32,
          }}
        >
          <button
            onClick={() => setActiveTab('assigned')}
            style={{
              padding: '16px 4px',
              fontSize: 14,
              fontWeight: 600,
              borderBottom: `2px solid ${activeTab === 'assigned' ? '#3B82F6' : 'transparent'}`,
              color: activeTab === 'assigned' ? '#2563EB' : '#64748B',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
          >
            Assigned Quizzes
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            style={{
              padding: '16px 4px',
              fontSize: 14,
              fontWeight: 600,
              borderBottom: `2px solid ${activeTab === 'ai' ? '#3B82F6' : 'transparent'}`,
              color: activeTab === 'ai' ? '#2563EB' : '#64748B',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'color 0.2s',
            }}
          >
            <FiActivity size={16} /> Generate AI Quiz
          </button>
        </div>
      </div>

      <div style={{ background: '#F8FAFC', minHeight: 'calc(100vh - 120px)' }}>
        {activeTab === 'assigned' ? renderAssignedQuiz() : renderAIQuiz()}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </AppLayout>
  )
}