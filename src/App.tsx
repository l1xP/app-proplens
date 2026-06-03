import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { LoginForm } from './components/auth/LoginForm'
import { RegisterForm } from './components/auth/RegisterForm'
import { Dashboard } from './pages/Dashboard'
import { EvaluationDetail } from './pages/EvaluationDetail'
import { CreateEvaluation } from './pages/CreateEvaluation'
import { Comparison } from './pages/Comparison'
import './index.css'

type View = 'dashboard' | 'evaluation' | 'create' | 'edit' | 'comparison'
type AuthView = 'login' | 'register'

function AppContent() {
  const { user, loading, signOut } = useAuth()
  const [authView, setAuthView] = useState<AuthView>('login')
  const [view, setView] = useState<View>('dashboard')
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null)
  const [comparisonIds, setComparisonIds] = useState<string[]>([])

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/' || path === '') {
        setView('dashboard')
        setSelectedEvaluationId(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleNavigate = (newView: View, evaluationId?: string) => {
    setView(newView)
    if (evaluationId) {
      setSelectedEvaluationId(evaluationId)
      window.history.pushState({}, '', `/evaluation/${evaluationId}`)
    } else if (newView === 'dashboard') {
      window.history.pushState({}, '', '/')
    }
  }

  const handleCompare = (ids: string[]) => {
    setComparisonIds(ids)
    setView('comparison')
  }

  const handleSignOut = async () => {
    await signOut()
    setAuthView('login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!user) {
    if (authView === 'login') {
      return <LoginForm onToggleMode={() => setAuthView('register')} />
    } else {
      return <RegisterForm onToggleMode={() => setAuthView('login')} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {view === 'dashboard' && (
        <Dashboard
          onNavigate={handleNavigate}
          onCompare={handleCompare}
          onSignOut={handleSignOut}
        />
      )}
      {view === 'create' && (
        <CreateEvaluation
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
        />
      )}
      {view === 'edit' && selectedEvaluationId && (
        <EvaluationDetail
          evaluationId={selectedEvaluationId}
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
          mode="edit"
        />
      )}
      {view === 'evaluation' && selectedEvaluationId && (
        <EvaluationDetail
          evaluationId={selectedEvaluationId}
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
          mode="view"
        />
      )}
      {view === 'comparison' && (
        <Comparison
          evaluationIds={comparisonIds}
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
