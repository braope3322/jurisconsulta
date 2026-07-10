import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ConsultaPage from './pages/ConsultaPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'

function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null)

  useEffect(() => {
    setIsAuth(localStorage.getItem('admin_auth') === 'true')
  }, [])

  if (isAuth === null) return null

  if (!isAuth) {
    return <LoginPage onLogin={() => setIsAuth(true)} />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<ConsultaPage />} />
      <Route path="/acessoadmin" element={
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={<Navigate to="/acessoadmin" replace />} />
    </Routes>
  )
}

export default App
