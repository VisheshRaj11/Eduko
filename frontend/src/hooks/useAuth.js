import useStore from '../store/useStore'

export function useAuth() {
  const { user, token, setUser, setToken, logout } = useStore()
  const isAuthenticated = !!token
  const isStudent = user?.role === 'student'
  const isTeacher = user?.role === 'teacher'
  const isVolunteer = user?.role === 'volunteer'

  return { user, token, isAuthenticated, isStudent, isTeacher, isVolunteer, setUser, setToken, logout }
}
