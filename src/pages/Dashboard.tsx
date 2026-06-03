import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/common/Layout'
import type { Evaluation } from '../types/database'
import { Plus, Search, Filter, MoreVertical, Trash2, Copy, Edit2, CheckSquare, Square, Building2 } from 'lucide-react'
import { formatCurrency, calculateEvaluation } from '../lib/calculations'

interface DashboardProps {
  onNavigate: (view: 'dashboard' | 'evaluation' | 'create' | 'edit' | 'comparison', evaluationId?: string) => void
  onCompare: (ids: string[]) => void
  onSignOut: () => void
}

type StatusFilter = 'all' | 'Draft' | 'Complete' | 'Investable' | 'Not Investable'

export function Dashboard({ onNavigate, onCompare, onSignOut }: DashboardProps) {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchEvaluations()
    }
  }, [user])

  async function fetchEvaluations() {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setEvaluations(data)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this evaluation?')) return

    const { error } = await supabase.from('evaluations').delete().eq('id', id)

    if (!error) {
      setEvaluations(evaluations.filter((e) => e.id !== id))
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
    setActionMenuId(null)
  }

  async function handleDuplicate(evaluation: Evaluation) {
    const { id, created_at, updated_at, ...rest } = evaluation
    const newEvaluation = {
      ...rest,
      property_name: `${evaluation.property_name} (Copy)`,
    }

    const { data, error } = await supabase
      .from('evaluations')
      .insert(newEvaluation)
      .select()
      .single()

    if (!error && data) {
      setEvaluations([data, ...evaluations])
    }
    setActionMenuId(null)
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  function getInvestableBadge(evaluation: Evaluation) {
    if (evaluation.status === 'Draft') {
      return null
    }

    const results = calculateEvaluation(evaluation)
    const passingCount = results.investableScore

    if (passingCount === 4) {
      return <span className="badge badge-success">Resounding Pass</span>
    } else if (passingCount >= 3) {
      return <span className="badge badge-success">Proceed</span>
    } else if (passingCount >= 2) {
      return <span className="badge badge-warning">Proceed with Caution</span>
    } else {
      return <span className="badge badge-error">Resounding No</span>
    }
  }

  function getBestROI(evaluation: Evaluation) {
    if (evaluation.status === 'Draft') return '-'
    const results = calculateEvaluation(evaluation)
    const rois = [
      results.scenarios.conservative.roi,
      results.scenarios.baseline.roi,
      results.scenarios.target.roi,
      results.scenarios.aggressive.roi,
    ]
    const best = Math.max(...rois)
    return `${(best * 100).toFixed(2)}%`
  }

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch =
      evaluation.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.property_address.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'Draft' && evaluation.status === 'Draft') ||
      (statusFilter === 'Complete' && evaluation.status === 'Complete') ||
      (statusFilter === 'Investable' && evaluation.status === 'Complete' && calculateEvaluation(evaluation).investableScore >= 3) ||
      (statusFilter === 'Not Investable' && evaluation.status === 'Complete' && calculateEvaluation(evaluation).investableScore < 3)

    return matchesSearch && matchesStatus
  })

  return (
    <Layout
      title="Dashboard"
      subtitle="Property Investment Evaluations"
      onSignOut={onSignOut}
      actions={
        <button onClick={() => onNavigate('create')} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          New Evaluation
        </button>
      }
    >
      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search by property name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="card">
            <div className="flex flex-wrap gap-2">
              {(['all', 'Draft', 'Complete', 'Investable', 'Not Investable'] as StatusFilter[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`btn ${
                      statusFilter === status ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    {status === 'all' ? 'All' : status}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comparison toolbar */}
      {selectedIds.size > 0 && (
        <div className="card mb-6 bg-surface-elevated">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              <span className="font-semibold text-accent">{selectedIds.size}</span> evaluations
              selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onCompare(Array.from(selectedIds))}
                className="btn btn-primary btn-sm"
                disabled={selectedIds.size < 2}
              >
                Compare ({selectedIds.size})
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="btn btn-ghost btn-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluations table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner" />
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No evaluations yet</h3>
          <p className="text-secondary mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'No evaluations match your search criteria'
              : 'Create your first property evaluation to get started'}
          </p>
          {searchQuery || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          ) : (
            <button onClick={() => onNavigate('create')} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Create Evaluation
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12"></th>
                <th>Property Name</th>
                <th>Type</th>
                <th>Purchase Price</th>
                <th>Investable</th>
                <th>Best ROI</th>
                <th>Status</th>
                <th>Created</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredEvaluations.map((evaluation) => (
                <tr key={evaluation.id}>
                  <td>
                    <button
                      onClick={() => toggleSelection(evaluation.id)}
                      className="p-1 hover:text-accent transition-colors"
                    >
                      {selectedIds.has(evaluation.id) ? (
                        <CheckSquare className="w-5 h-5 text-accent" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => onNavigate('evaluation', evaluation.id)}
                      className="text-accent hover:underline font-medium text-left"
                    >
                      {evaluation.property_name}
                    </button>
                    {evaluation.property_address && (
                      <p className="text-xs text-muted mt-0.5">{evaluation.property_address}</p>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{evaluation.property_type}</span>
                  </td>
                  <td>{formatCurrency(evaluation.purchase_price)}</td>
                  <td>{getInvestableBadge(evaluation)}</td>
                  <td className="font-mono text-sm">{getBestROI(evaluation)}</td>
                  <td>
                    <span
                      className={`badge ${
                        evaluation.status === 'Complete' ? 'badge-success' : 'badge-neutral'
                      }`}
                    >
                      {evaluation.status}
                    </span>
                  </td>
                  <td>{new Date(evaluation.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === evaluation.id ? null : evaluation.id)}
                        className="btn btn-ghost p-1.5"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {actionMenuId === evaluation.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-surface-elevated border border-border rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              onNavigate('edit', evaluation.id)
                              setActionMenuId(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-surface-subtle flex items-center gap-2 rounded-t-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicate(evaluation)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-surface-subtle flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleDelete(evaluation.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-error-subtle text-error flex items-center gap-2 rounded-b-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
