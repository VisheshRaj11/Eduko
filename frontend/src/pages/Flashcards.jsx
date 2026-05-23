import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiLayers, FiSettings, FiDownload, FiArrowRight, FiArrowLeft, FiRefreshCcw, FiLoader, FiBook } from 'react-icons/fi';
import AppLayout from '../components/AppLayout';
import { flashcardsAPI, lessonAPI } from '../api/client';
import html2pdf from 'html2pdf.js';

export default function Flashcards() {
  const { t } = useTranslation();
  const [step, setStep] = useState('setup'); // setup, loading, playing
  const [formData, setFormData] = useState({
    lesson_id: '',
    subject: '',
    count: 10,
    prompt: ''
  });
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    lessonAPI.list()
      .then(r => {
        const fetchedLessons = r.data?.data || r.data || [];
        setLessons(fetchedLessons);
        if (fetchedLessons.length > 0) {
          setFormData(f => ({ ...f, lesson_id: fetchedLessons[0]._id || fetchedLessons[0].id }));
        }
      })
      .catch(() => setLessons([]))
      .finally(() => setLessonsLoading(false));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setStep('loading');
    setError('');
    try {
      const res = await flashcardsAPI.generate(formData);
      if (res.data && res.data.flashcards) {
        setFlashcards(res.data.flashcards);
        setCurrentIndex(0);
        setFlipped(false);
        setStep('playing');
      } else {
        throw new Error('Invalid flashcard data received');
      }
    } catch (err) {
      setError('Failed to generate flashcards. Please try again.');
      setStep('setup');
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setFlipped(false);
      setTimeout(() => setCurrentIndex(c => c + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      setTimeout(() => setCurrentIndex(c => c - 1), 150);
    }
  };

  const handlePrint = () => {
    const element = document.getElementById('pdf-content');
    const opt = {
      margin:       0.5,
      filename:     `Flashcards_${formData.lesson_id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  return (
    <AppLayout title={t('fcTitle')}>
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '40px 24px 80px',
          background: '#FFF5F6', // light pink background
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        {/* Header (visible on screen, hidden in print) */}
        <div className="print-hidden">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                background: '#F06292',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <FiLayers size={26} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#1E1B2E',
                  marginBottom: 4,
                }}
              >
                {t('fcTitle')}
              </h1>
              <p style={{ fontSize: 14, color: '#6B4E6E' }}>
                {t('fcDesc')}
              </p>
            </div>
          </div>

          {error && (
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
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* SETUP STEP */}
        {step === 'setup' && (
          <div
            className="print-hidden"
            style={{
              background: 'white',
              borderRadius: 32,
              padding: '32px 28px',
              border: '1px solid #FCE4EC',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            }}
          >
            <form onSubmit={handleGenerate}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 24,
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
                    {t('selectLesson')}
                  </label>
                  <select
                    value={formData.lesson_id}
                    onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 20,
                      border: '1px solid #FCE4EC',
                      background: '#FFF5F6',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    disabled={lessonsLoading}
                  >
                    {lessonsLoading ? (
                      <option>Loading lessons...</option>
                    ) : lessons.length > 0 ? (
                      lessons.map(l => (
                        <option key={l._id || l.id} value={l._id || l.id}>
                          {l.title} ({l.subject})
                        </option>
                      ))
                    ) : (
                      <option value="">No lessons available</option>
                    )}
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
                    max="20"
                    value={formData.count}
                    onChange={(e) =>
                      setFormData({ ...formData, count: parseInt(e.target.value) })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 20,
                      border: '1px solid #FCE4EC',
                      background: '#FFF5F6',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
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
                  {t('specificTopic')}
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder={t('specificTopicPlaceholder')}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 24,
                    border: '1px solid #FCE4EC',
                    background: '#FFF5F6',
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
                  borderTop: '1px solid #FCE4EC',
                  paddingTop: 24,
                }}
              >
                <button
                  type="submit"
                  style={{
                    background: '#F06292',
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#E91E63')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#F06292')}
                >
                  <FiSettings size={16} /> {t('generateFc')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LOADING STEP */}
        {step === 'loading' && (
          <div
            className="print-hidden"
            style={{
              background: 'white',
              borderRadius: 32,
              padding: '60px 32px',
              textAlign: 'center',
              border: '1px solid #FCE4EC',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 24px',
                border: '3px solid #FCE4EC',
                borderTopColor: '#F06292',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E1B2E', marginBottom: 8 }}>
              {t('craftingFc')}
            </h3>
            <p style={{ fontSize: 14, color: '#6B4E6E' }}>
              {t('craftingFcDesc')}
            </p>
          </div>
        )}

        {/* PLAYING STEP */}
        {step === 'playing' && flashcards.length > 0 && (
          <>
            <div className="print-hidden" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Progress */}
              <div style={{ width: '100%', maxWidth: 560, marginBottom: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#6B4E6E', marginBottom: 12 }}>
                  {t('cardOf', { current: currentIndex + 1, total: flashcards.length })}
                </div>
                <div style={{ width: '100%', background: '#FCE4EC', borderRadius: 4, height: 6 }}>
                  <div
                    style={{
                      width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
                      background: '#F06292',
                      height: 6,
                      borderRadius: 4,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>

              {/* Flashcard */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 560,
                  aspectRatio: '4/3',
                  cursor: 'pointer',
                  perspective: '1000px',
                }}
                onClick={() => setFlipped(!flipped)}
              >
                <motion.div
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.5s',
                  }}
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  {/* Front */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      background: 'white',
                      borderRadius: 32,
                      border: '2px solid #FCE4EC',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                      padding: '32px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ position: 'absolute', top: 20, left: 20, color: '#FCE4EC' }}>
                      <FiLayers size={24} />
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#9CA3AF',
                      }}
                    >
                      {t('frontQuestion')}
                    </span>
                    <h2
                      style={{
                        fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
                        fontWeight: 700,
                        color: '#1E1B2E',
                        lineHeight: 1.4,
                      }}
                    >
                      {flashcards[currentIndex].front}
                    </h2>
                    <p
                      style={{
                        position: 'absolute',
                        bottom: 20,
                        fontSize: 12,
                        color: '#9CA3AF',
                      }}
                    >
                      {t('clickToFlip')}
                    </p>
                  </div>

                  {/* Back */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      background: '#FCE4EC',
                      borderRadius: 32,
                      border: '2px solid #F8BBD0',
                      transform: 'rotateY(180deg)',
                      padding: '32px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ position: 'absolute', top: 20, left: 20, color: '#F8BBD0' }}>
                      <FiLayers size={24} />
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#D81B60',
                      }}
                    >
                      {t('backAnswer')}
                    </span>
                    <p
                      style={{
                        fontSize: 'clamp(1rem, 4vw, 1.4rem)',
                        fontWeight: 500,
                        color: '#1E1B2E',
                        lineHeight: 1.5,
                      }}
                    >
                      {flashcards[currentIndex].back}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  marginTop: 32,
                }}
              >
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 44,
                    background: 'white',
                    border: '1px solid #FCE4EC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentIndex === 0 ? 0.5 : 1,
                    transition: 'background 0.2s',
                  }}
                >
                  <FiArrowLeft size={20} color="#F06292" />
                </button>
                <button
                  onClick={() => setStep('setup')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 40,
                    background: 'white',
                    border: '1px solid #FCE4EC',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <FiRefreshCcw size={16} color="#F06292" /> {t('newSet')}
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === flashcards.length - 1}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 44,
                    background: 'white',
                    border: '1px solid #FCE4EC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentIndex === flashcards.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: currentIndex === flashcards.length - 1 ? 0.5 : 1,
                    transition: 'background 0.2s',
                  }}
                >
                  <FiArrowRight size={20} color="#F06292" />
                </button>
              </div>

              {/* Download PDF */}
              <div
                style={{
                  marginTop: 40,
                  borderTop: '1px solid #FCE4EC',
                  paddingTop: 32,
                  width: '100%',
                  maxWidth: 560,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <button
                  onClick={handlePrint}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 28px',
                    background: '#F06292',
                    color: 'white',
                    borderRadius: 40,
                    fontWeight: 600,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#E91E63')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#F06292')}
                >
                  <FiDownload size={18} /> {t('downloadPdf')}
                </button>
              </div>
            </div>

            {/* Hidden PDF Layout */}
            <div id="pdf-content" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px', background: 'white', padding: '24px' }}>
              <div
                style={{
                  marginBottom: 32,
                  paddingBottom: 16,
                  borderBottom: '2px solid #1E1B2E',
                }}
              >
                <h1 style={{ fontSize: 28, fontWeight: 800 }}>{formData.subject} Flashcards</h1>
                <p style={{ color: '#6B4E6E', marginTop: 8 }}>
                  {t('topic')}: {formData.prompt || 'General Review'} | {t('count')}: {flashcards.length}
                </p>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 20,
                }}
              >
                {flashcards.map((card, idx) => (
                  <div
                    key={idx}
                    style={{
                      breakInside: 'avoid',
                      marginBottom: 24,
                      border: '1px solid #E2E8F0',
                      borderRadius: 16,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        background: '#F1F5F9',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        borderBottom: '1px solid #E2E8F0',
                      }}
                    >
                      Card {idx + 1} - {t('frontQuestion')}
                    </div>
                    <div
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        fontWeight: 600,
                        minHeight: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {card.front}
                    </div>
                    <div
                      style={{
                        background: '#F1F5F9',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        borderTop: '1px solid #E2E8F0',
                        borderBottom: '1px solid #E2E8F0',
                      }}
                    >
                      Card {idx + 1} - {t('backAnswer')}
                    </div>
                    <div
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        minHeight: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {card.back}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Global print styles and spinner keyframes */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media print {
            @page {
              margin: 1cm;
              size: A4;
            }
            body * {
              visibility: hidden;
            }
            .print-only, .print-only * {
              visibility: visible;
              display: block !important;
            }
            .print-only {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print-hidden {
              display: none !important;
            }
          }
        `}
      </style>
    </AppLayout>
  );
}