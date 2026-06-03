import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Layout } from '../components/common/Layout'
import type { Evaluation } from '../types/database'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { calculateEvaluation, formatCurrency, formatPercent } from '../lib/calculations'
import type { CalculationResults } from '../lib/calculations'

interface ComparisonProps {
  evaluationIds: string[]
  onNavigate: (view: 'dashboard' | 'evaluation' | 'create' | 'edit' | 'comparison', evaluationId?: string) => void
  onSignOut: () => void
}

interface EvaluationWithResults {
  evaluation: Evaluation
  results: CalculationResults
}

export function Comparison({ evaluationIds, onNavigate, onSignOut }: ComparisonProps) {
  const [evaluations, setEvaluations] = useState<EvaluationWithResults[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvaluations()
  }, [evaluationIds])

  async function fetchEvaluations() {
    if (evaluationIds.length === 0) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .in('id', evaluationIds)

    if (!error && data) {
      const withResults = data.map((evaluation) => ({
        evaluation,
        results: calculateEvaluation(evaluation),
      }))
      setEvaluations(withResults)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <Layout title="Comparison" onSignOut={onSignOut}>
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner" />
        </div>
      </Layout>
    )
  }

  if (evaluations.length === 0) {
    return (
      <Layout title="Comparison" onSignOut={onSignOut}>
        <div className="card text-center py-12">
          <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Evaluations to Compare</h3>
          <p className="text-secondary mb-6">Select 2 or more evaluations from the dashboard to compare.</p>
          <button onClick={() => onNavigate('dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </Layout>
    )
  }

  const getBestROI = (scenarios: CalculationResults['scenarios']) => {
    const rois = [
      scenarios.conservative.roi,
      scenarios.baseline.roi,
      scenarios.target.roi,
      scenarios.aggressive.roi,
    ]
    return Math.max(...rois)
  }

  const bestOverall = evaluations.reduce((best, current) =>
    getBestROI(current.results.scenarios) > getBestROI(best.results.scenarios) ? current : best
  )

  return (
    <Layout
      title="Property Comparison"
      subtitle={`${evaluations.length} evaluations`}
      onSignOut={onSignOut}
      actions={
        <button onClick={() => onNavigate('dashboard')} className="btn btn-ghost">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      }
    >
      {/* Summary Cards */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${evaluations.length}, 1fr)` }}>
        {evaluations.map(({ evaluation, results }) => {
          const isBest = evaluation.id === bestOverall.evaluation.id
          return (
            <div key={evaluation.id} className={`card ${isBest ? 'border-accent border-2' : ''}`}>
              {isBest && (
                <div className="flex items-center gap-1 mb-3 text-accent text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  Best Opportunity
                </div>
              )}
              <button
                onClick={() => onNavigate('evaluation', evaluation.id)}
                className="text-accent hover:underline font-semibold text-lg mb-2 text-left w-full"
              >
                {evaluation.property_name}
              </button>
              {evaluation.property_address && (
                <p className="text-sm text-secondary mb-3">{evaluation.property_address}</p>
              )}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Type</span>
                  <span>{evaluation.property_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Price</span>
                  <span className="font-mono">{formatCurrency(evaluation.purchase_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Initial Investment</span>
                  <span className="font-mono">{formatCurrency(results.initialInvestmentWithoutGST)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Table */}
      <div className="table-container mb-6">
        <table className="table">
          <thead>
            <tr>
              <th>Metric</th>
              {evaluations.map(({ evaluation }) => (
                <th key={evaluation.id} className="text-center">
                  <button
                    onClick={() => onNavigate('evaluation', evaluation.id)}
                    className="text-accent hover:underline"
                  >
                    {evaluation.property_name}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-medium">Purchase Price</td>
              {evaluations.map(({ evaluation }) => (
                <td key={evaluation.id} className="text-center font-mono">
                  {formatCurrency(evaluation.purchase_price)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="font-medium">Purchase PSF</td>
              {evaluations.map(({ results }) => (
                <td key={results.bsd} className="text-center font-mono">
                  {formatCurrency(results.purchasePSF, 2)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="font-medium">Initial Investment</td>
              {evaluations.map(({ results }) => (
                <td key={results.initialInvestmentWithoutGST} className="text-center font-mono">
                  {formatCurrency(results.initialInvestmentWithoutGST)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="font-medium">Monthly Pocket Money</td>
              {evaluations.map(({ results }) => (
                <td key={results.monthlyPocketMoney} className="text-center font-mono">
                  {formatCurrency(results.monthlyPocketMoney)}
                </td>
              ))}
            </tr>
            <tr className="bg-surface-subtle font-semibold">
              <td>Decision</td>
              {evaluations.map(({ results }) => {
                const color =
                  results.investableScore === 4
                    ? 'text-success'
                    : results.investableScore >= 3
                    ? 'text-success'
                    : results.investableScore >= 2
                    ? 'text-warning'
                    : 'text-error'
                return (
                  <td key={results.investableDecision} className={`text-center font-semibold ${color}`}>
                    {results.investableDecision}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ROI Comparison by Scenario */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">ROI by Scenario at Plan Exit Year</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Scenario</th>
                {evaluations.map(({ evaluation }) => (
                  <th key={evaluation.id} className="text-center">
                    {evaluation.property_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Conservative</td>
                {evaluations.map(({ results }) => {
                  const roi = results.scenarios.conservative.roi
                  const isMax = roi === Math.max(...evaluations.map((e) => e.results.scenarios.conservative.roi))
                  return (
                    <td key={results.bsd} className={`text-center font-mono ${isMax ? 'font-bold text-accent' : ''}`}>
                      <span className={roi >= 0.03 ? 'text-success' : 'text-error'}>
                        {formatPercent(roi)}
                      </span>
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="font-medium">Baseline</td>
                {evaluations.map(({ results }) => {
                  const roi = results.scenarios.baseline.roi
                  const isMax = roi === Math.max(...evaluations.map((e) => e.results.scenarios.baseline.roi))
                  return (
                    <td key={results.bsd} className={`text-center font-mono ${isMax ? 'font-bold text-accent' : ''}`}>
                      <span className={roi >= 0.03 ? 'text-success' : 'text-error'}>
                        {formatPercent(roi)}
                      </span>
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="font-medium">Target</td>
                {evaluations.map(({ results }) => {
                  const roi = results.scenarios.target.roi
                  const isMax = roi === Math.max(...evaluations.map((e) => e.results.scenarios.target.roi))
                  return (
                    <td key={results.bsd} className={`text-center font-mono ${isMax ? 'font-bold text-accent' : ''}`}>
                      <span className={roi >= 0.03 ? 'text-success' : 'text-error'}>
                        {formatPercent(roi)}
                      </span>
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="font-medium">Aggressive</td>
                {evaluations.map(({ results }) => {
                  const roi = results.scenarios.aggressive.roi
                  const isMax = roi === Math.max(...evaluations.map((e) => e.results.scenarios.aggressive.roi))
                  return (
                    <td key={results.bsd} className={`text-center font-mono ${isMax ? 'font-bold text-accent' : ''}`}>
                      <span className={roi >= 0.03 ? 'text-success' : 'text-error'}>
                        {formatPercent(roi)}
                      </span>
                    </td>
                  )
                })}
              </tr>
              <tr className="bg-surface-subtle font-semibold">
                <td>Best ROI</td>
                {evaluations.map(({ results }) => (
                  <td key={results.bsd} className="text-center font-mono text-accent font-bold">
                    {formatPercent(getBestROI(results.scenarios))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
