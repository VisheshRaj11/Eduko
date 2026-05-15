import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import { studentAPI, quizAPI } from '../api/client'
import { FiCheck, FiX, FiAward, FiArrowRight } from 'react-icons/fi'

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
  const [quiz, setQuiz] = useState(null)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    quizAPI.getByLesson('1').then(r => setQuiz(r.data)).catch(() => setQuiz(DEMO_QUIZ)).finally(() => setLoading(false))
  }, [])

  const handleSelect = (idx) => {
    if (selected !== null) return
    setSelected(idx)
    const correct = quiz.questions[current].correct === idx
    const newAnswers = [...answers, { questionIdx: current, selected: idx, correct }]
    setAnswers(newAnswers)

    setTimeout(() => {
      if (current + 1 < quiz.questions.length) {
        setCurrent(c => c + 1)
        setSelected(null)
      } else {
        submitQuiz(newAnswers)
      }
    }, 1000)
  }

  const submitQuiz = async (finalAnswers) => {
    setSubmitting(true)
    const score = Math.round((finalAnswers.filter(a => a.correct).length / quiz.questions.length) * 100)
    try {
      await studentAPI.submitQuiz({ quiz_id: quiz._id, score, answers: finalAnswers })
    } catch { /* offline — save to sync queue */ }
    setDone(true)
    setSubmitting(false)
  }

  const score = answers.filter(a => a.correct).length
  const total = quiz?.questions?.length || 0

  if (loading) return <AppLayout title={t('quizzes')}><div className="main-content"><div className="animate-pulse space-y-4">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-16 rounded-xl"/>)}</div></div></AppLayout>

  if (done) return (
    <AppLayout title={t('quizzes')}>
      <div className="main-content flex items-center justify-center" style={{ minHeight: 400 }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="surface-card p-10 text-center max-w-md w-full">
          <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl
            ${score >= total * 0.7 ? 'bg-green-100' : 'bg-amber-100'}`}>
            {score >= total * 0.7 ? '🏆' : '📝'}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
          <p className="text-slate-500 mb-6">You scored</p>
          <div className="text-5xl font-bold text-gradient mb-2">{score}/{total}</div>
          <div className="text-slate-500 mb-8">{Math.round((score / total) * 100)}% correct</div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            {answers.map((a, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${a.correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {a.correct ? <FiCheck /> : <FiX />} Q{i + 1}: {a.correct ? 'Correct' : 'Wrong'}
              </div>
            ))}
          </div>
          <button onClick={() => { setCurrent(0); setSelected(null); setAnswers([]); setDone(false) }} className="btn btn-primary btn-full gap-2">
            <FiArrowRight /> Try Again
          </button>
        </motion.div>
      </div>
    </AppLayout>
  )

  const q = quiz?.questions?.[current]

  return (
    <AppLayout title={t('quizzes')}>
      <div className="main-content">
        {/* Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">{t('question')} {current + 1} {t('of')} {total}</span>
          <span className="badge badge-green">{quiz?.title}</span>
        </div>
        <div className="progress-bar mb-8">
          <div className="progress-fill" style={{ width: `${((current) / total) * 100}%` }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="surface-card p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700">{current + 1}</div>
              <p className="text-xl font-bold text-slate-800">{q?.text}</p>
            </div>

            <div className="grid gap-3">
              {q?.options?.map((opt, i) => {
                let cls = 'p-4 rounded-xl border-2 text-left text-sm font-medium cursor-pointer transition-all '
                if (selected === null) cls += 'border-slate-200 hover:border-primary-400 hover:bg-primary-50 text-slate-700'
                else if (i === q.correct) cls += 'border-green-500 bg-green-50 text-green-800'
                else if (i === selected && selected !== q.correct) cls += 'border-red-400 bg-red-50 text-red-800'
                else cls += 'border-slate-200 text-slate-400'

                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null} className={cls}>
                    <span className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                      {selected !== null && i === q.correct && <FiCheck className="ml-auto text-green-600" />}
                      {selected !== null && i === selected && selected !== q.correct && <FiX className="ml-auto text-red-500" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
