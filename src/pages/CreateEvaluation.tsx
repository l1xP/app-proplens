import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/common/Layout'
import { EvaluationForm } from '../components/evaluations/EvaluationForm'
import type { Evaluation } from '../types/database'
import { ArrowLeft } from 'lucide-react'

interface CreateEvaluationProps {
  onNavigate: (view: 'dashboard' | 'evaluation' | 'create' | 'edit' | 'comparison', evaluationId?: string) => void
  onSignOut: () => void
}

export function CreateEvaluation({ onNavigate, onSignOut }: CreateEvaluationProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async (evaluation: Evaluation) => {
    setIsSubmitting(true)
    // Navigate to evaluation detail after saving
    onNavigate('evaluation', evaluation.id)
    setIsSubmitting(false)
  }

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      onNavigate('dashboard')
    }
  }

  return (
    <Layout
      title="New Evaluation"
      subtitle="Create a new property investment evaluation"
      onSignOut={onSignOut}
      actions={
        <button
          onClick={() => onNavigate('dashboard')}
          className="btn btn-ghost"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      }
    >
      <EvaluationForm
        mode="create"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </Layout>
  )
}
