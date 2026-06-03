import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Lightbulb } from 'lucide-react'

interface LoginFormProps {
  onToggleMode: () => void
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-subtle mb-4">
              <Lightbulb className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-3xl font-bold mb-2">PropLens</h1>
            <p className="text-secondary text-sm mb-3">Singapore Property Investment Analysis</p>
            <p className="text-secondary">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-error-subtle rounded-md">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-secondary text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="text-accent hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
