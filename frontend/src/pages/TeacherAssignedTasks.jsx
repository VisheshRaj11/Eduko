import { useState, useEffect } from 'react'
import { teacherAPI } from '../api/client'
import AppLayout from '../components/AppLayout'
import { useTranslation } from 'react-i18next'
import { FiPlus, FiCheckCircle, FiCircle, FiUsers, FiTarget, FiSend, FiInbox, FiClock, FiActivity } from 'react-icons/fi'
import { motion } from 'framer-motion'

export default function TeacherAssignedTasks() {
  const { t } = useTranslation()
  const [students, setStudents] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [newTaskText, setNewTaskText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [studentsRes, tasksRes] = await Promise.all([
        teacherAPI.getStudents(),
        teacherAPI.getAssignedTasks()
      ])
      
      const studentsData = studentsRes.data || []
      setStudents(studentsData)
      setTasks(tasksRes.data || [])
      
      if (studentsData.length > 0) {
        setSelectedStudentId(studentsData[0].user_id)
      }
    } catch (err) {
      console.error('Error fetching assigned tasks data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTask = async (e) => {
    e.preventDefault()
    if (!newTaskText.trim() || !selectedStudentId) return
    
    try {
      const res = await teacherAPI.assignTask({
        student_id: selectedStudentId,
        task_description: newTaskText.trim()
      })
      setTasks([res.data.task, ...tasks])
      setNewTaskText('')
    } catch (err) {
      console.error('Failed to assign task', err)
      alert('Failed to assign task')
    }
  }

  // Filter tasks for selected student
  const studentTasks = tasks.filter(t => t.student_id === selectedStudentId)
  
  // Get selected student name
  const selectedStudent = students.find(s => s.user_id === selectedStudentId)
  
  return (
    <AppLayout title="Assigned Tasks">
      <div
        style={{
          minHeight: '100vh',
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.04) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          padding: '0 0 60px 0',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '32px 24px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Two column layout */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 28,
              flexWrap: 'wrap',
            }}
          >
            {/* Left Panel: Student List */}
            <div
              style={{
                flex: '1',
                minWidth: '280px',
                background: 'white',
                borderRadius: 32,
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 160px)',
                minHeight: 500,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                }}
              >
                <h3
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0F172A',
                  }}
                >
                  <FiUsers size={20} color="#8B5CF6" />
                  My Students
                </h3>
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 12px',
                }}
              >
                {loading ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: '#64748B',
                    }}
                  >
                    Loading...
                  </div>
                ) : students.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: '#64748B',
                    }}
                  >
                    No students found
                  </div>
                ) : (
                  students.map((student) => (
                    <button
                      key={student.user_id}
                      onClick={() => setSelectedStudentId(student.user_id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px 16px',
                        borderRadius: 20,
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: selectedStudentId === student.user_id ? '#EFF6FF' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedStudentId !== student.user_id) {
                          e.currentTarget.style.background = '#F8FAFC'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedStudentId !== student.user_id) {
                          e.currentTarget.style.background = 'transparent'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img 
                          src={student.avatar ? (student.avatar.startsWith('http') ? student.avatar : `http://localhost:8000${student.avatar}`) : `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(student.name)}&backgroundColor=f8fafc,e2e8f0,f1f5f9`} 
                          alt={student.name}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: '#F1F5F9',
                            objectFit: 'cover'
                          }}
                        />
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: selectedStudentId === student.user_id ? 700 : 600,
                            color: selectedStudentId === student.user_id ? '#6D28D9' : '#1E293B',
                          }}
                        >
                          {student.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          background: selectedStudentId === student.user_id ? '#EDE9FE' : '#F1F5F9',
                          padding: '4px 10px',
                          borderRadius: 20,
                          color: selectedStudentId === student.user_id ? '#7C3AED' : '#475569',
                          fontWeight: 600,
                        }}
                      >
                        Grade {student.grade_level}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel: Tasks */}
            <div
              style={{
                flex: '2',
                minWidth: '320px',
                background: 'white',
                borderRadius: 32,
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 160px)',
                minHeight: 500,
                overflow: 'hidden',
              }}
            >
              {/* Assign Task Form */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                }}
              >
                <h3
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: 16,
                  }}
                >
                  <FiTarget size={22} color="#8B5CF6" />
                  Assign Mission
                </h3>
                <form onSubmit={handleAssignTask} style={{ display: 'flex', gap: 12 }}>
                  <input
                    type="text"
                    placeholder="E.g., Complete Chapter 4 reading"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 24,
                      border: '1px solid #E2E8F0',
                      background: 'white',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                  />
                  <button
                    type="submit"
                    disabled={!newTaskText.trim() || !selectedStudentId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                      color: 'white',
                      padding: '0 24px',
                      borderRadius: 40,
                      fontWeight: 700,
                      fontSize: 14,
                      border: 'none',
                      cursor: !newTaskText.trim() || !selectedStudentId ? 'not-allowed' : 'pointer',
                      opacity: !newTaskText.trim() || !selectedStudentId ? 0.6 : 1,
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (newTaskText.trim() && selectedStudentId) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (newTaskText.trim() && selectedStudentId) {
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    <FiSend size={16} /> Send
                  </button>
                </form>
              </div>

              {/* Task List */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 24px',
                }}
              >
                {!selectedStudentId ? (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9CA3AF',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ width: 64, height: 64, background: '#F8FAFC', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <FiUsers size={32} color="#CBD5E1" />
                    </div>
                    <p style={{ fontWeight: 600, color: '#64748B' }}>Select a student to view or assign missions.</p>
                  </div>
                ) : studentTasks.length === 0 ? (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9CA3AF',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ width: 64, height: 64, background: '#F8FAFC', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <FiInbox size={32} color="#CBD5E1" />
                    </div>
                    <p style={{ fontWeight: 600, color: '#64748B' }}>No missions assigned to {selectedStudent?.name} yet.</p>
                    <p style={{ fontSize: 13 }}>Send a new mission to track their progress.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {studentTasks.map((task) => (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 14,
                          padding: '16px 18px',
                          borderRadius: 24,
                          background: task.is_completed ? '#F8FAFC' : 'white',
                          border: `1px solid ${task.is_completed ? '#E2E8F0' : '#F0F0F0'}`,
                          opacity: task.is_completed ? 0.7 : 1,
                        }}
                      >
                        <div style={{ marginTop: 2, flexShrink: 0 }}>
                          {task.is_completed ? (
                            <FiCheckCircle size={20} color="#10B981" />
                          ) : (
                            <FiCircle size={20} color="#CBD5E1" />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: task.is_completed ? '#94A3B8' : '#1E293B',
                              textDecoration: task.is_completed ? 'line-through' : 'none',
                              marginBottom: 6,
                            }}
                          >
                            {task.task_description}
                          </p>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#9CA3AF',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F8FAFC', padding: '4px 10px', borderRadius: 20 }}>
                              <FiClock size={12} /> {new Date(task.created_at).toLocaleDateString()}
                            </span>
                            {task.is_completed && task.completed_at && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#ECFDF5', color: '#10B981', padding: '4px 10px', borderRadius: 20 }}>
                                <FiActivity size={12} /> Done {new Date(task.completed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}