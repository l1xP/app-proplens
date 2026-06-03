import { useState } from 'react'
import { Lightbulb, LogOut, Menu, X } from 'lucide-react'

interface LayoutProps {
  title: string
  subtitle?: string
  onSignOut: () => void
  actions?: React.ReactNode
  children: React.ReactNode
}

export function Layout({ title, subtitle, onSignOut, actions, children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-subtle">
                <Lightbulb className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-xl font-bold">
                  <span className="text-accent">PropLens</span>
                  <span className="hidden sm:inline text-secondary ml-2">{title}</span>
                </div>
                {subtitle && <p className="text-sm text-secondary">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {actions}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn btn-ghost p-2 lg:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Desktop sign out button */}
              <button onClick={onSignOut} className="btn btn-ghost hidden lg:inline-flex">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-surface">
            <div className="px-6 py-4 space-y-3">
              <button onClick={onSignOut} className="btn btn-ghost w-full justify-start">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
