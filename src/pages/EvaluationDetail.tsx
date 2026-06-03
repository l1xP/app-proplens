import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Layout } from '../components/common/Layout'
import { EvaluationForm } from '../components/evaluations/EvaluationForm'
import { SensitivitySliders } from '../components/common/SensitivitySliders'
import type { Evaluation } from '../types/database'
import {
  ArrowLeft,
  Edit2,
  Copy,
  Trash2,
  Download,
  TrendingUp,
  DollarSign,
  Calculator,
  BarChart3,
  Users,
  LineChart
} from 'lucide-react'
import { TrendLineChart } from '../components/common/TrendLineChart'
import {
  calculateEvaluation,
  formatCurrency,
  formatPercent,
  formatNumber
} from '../lib/calculations'
import type { CalculationResults } from '../lib/calculations'

interface EvaluationDetailProps {
  evaluationId: string
  onNavigate: (view: 'dashboard' | 'evaluation' | 'create' | 'edit' | 'comparison', evaluationId?: string) => void
  onSignOut: () => void
  mode: 'view' | 'edit'
}

export function EvaluationDetail({ evaluationId, onNavigate, onSignOut, mode }: EvaluationDetailProps) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [originalEvaluation, setOriginalEvaluation] = useState<Evaluation | null>(null)
  const [results, setResults] = useState<CalculationResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'plan' | 'yearly'>('plan')

  async function fetchEvaluation() {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', evaluationId)
      .single()

    if (!error && data) {
      setEvaluation(data)
      setOriginalEvaluation(data)
      setResults(calculateEvaluation(data))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEvaluation()
  }, [evaluationId])

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this evaluation?')) return

    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', evaluationId)

    if (!error) {
      onNavigate('dashboard')
    }
  }

  async function handleDuplicate() {
    if (!evaluation) return

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
      onNavigate('evaluation', data.id)
    }
  }

  async function handleSave(evaluation: Evaluation) {
    setEvaluation(evaluation)
    setOriginalEvaluation(evaluation)
    setResults(calculateEvaluation(evaluation))
    onNavigate('evaluation', evaluation.id)
  }

  function handleSliderChange(modifiedEvaluation: Evaluation) {
    setEvaluation(modifiedEvaluation)
    setResults(calculateEvaluation(modifiedEvaluation))
  }

  if (loading) {
    return (
      <Layout title="Loading..." onSignOut={onSignOut}>
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner" />
        </div>
      </Layout>
    )
  }

  if (!evaluation || !results) {
    return (
      <Layout title="Not Found" onSignOut={onSignOut}>
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Evaluation not found</h2>
          <p className="text-secondary mb-6">This evaluation may have been deleted.</p>
          <button onClick={() => onNavigate('dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </Layout>
    )
  }

  if (mode === 'edit') {
    return (
      <Layout
        title="Edit Evaluation"
        subtitle={evaluation.property_name}
        onSignOut={onSignOut}
        actions={
          <button
            onClick={() => onNavigate('evaluation', evaluationId)}
            className="btn btn-ghost"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </button>
        }
      >
        <EvaluationForm
          evaluation={evaluation}
          mode="edit"
          onSave={handleSave}
          onCancel={() => onNavigate('evaluation', evaluationId)}
        />
      </Layout>
    )
  }

  const investableColor =
    results.investableScore === 4
      ? 'text-success'
      : results.investableScore >= 3
      ? 'text-success'
      : results.investableScore >= 2
      ? 'text-warning'
      : 'text-error'

  const investableBg =
    results.investableScore === 4
      ? 'bg-success-subtle'
      : results.investableScore >= 3
      ? 'bg-success-subtle'
      : results.investableScore >= 2
      ? 'bg-warning-subtle'
      : 'bg-error-subtle'

  return (
    <Layout
      title={evaluation.property_name}
      subtitle={evaluation.property_address || evaluation.property_type}
      onSignOut={onSignOut}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('edit', evaluationId)}
            className="btn btn-secondary"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button onClick={handleDuplicate} className="btn btn-ghost">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={handleDelete} className="btn btn-ghost text-error">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => alert('PDF export coming soon')} className="btn btn-primary">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      }
    >
      {/* Investable Decision Banner */}
      <div className={`card ${investableBg} mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className={`w-6 h-6 ${investableColor}`} />
            <div>
              <p className={`text-2xl font-bold ${investableColor}`}>
                {results.investableDecision}
              </p>
              <p className="text-sm text-secondary">
                {results.investableScore}/4 scenarios meet the 3% ROI threshold
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-secondary">Plan Exit Year</p>
            <p className="text-2xl font-bold">Year {evaluation.plan_exit_year}</p>
          </div>
        </div>
      </div>

      {/* Sensitivity Sliders */}
      <SensitivitySliders
        evaluation={evaluation}
        onValuesChange={handleSliderChange}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-muted" />
            <p className="text-sm text-secondary">Purchase Price</p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(evaluation.purchase_price)}</p>
          <p className="text-sm text-muted mt-1">{formatCurrency(results.purchasePSF, 2)}/sqft</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-muted" />
            <p className="text-sm text-secondary">Initial Investment</p>
          </div>
          <p className="text-2xl font-bold">
            {formatCurrency(results.initialInvestmentWithoutGST)}
          </p>
          {results.gstRefundable > 0 && (
            <p className="text-sm text-success mt-1">
              GST Refundable: {formatCurrency(results.gstRefundable)}
            </p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted" />
            <p className="text-sm text-secondary">Monthly Pocket Money</p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(results.monthlyPocketMoney)}</p>
          <p className="text-sm text-muted mt-1">Rental - Expenses</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-muted" />
            <p className="text-sm text-secondary">Loan Amount</p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(results.loanAmount)}</p>
          <p className="text-sm text-muted mt-1">
            Monthly: {formatCurrency(results.monthlyMortgage)}
          </p>
        </div>
      </div>

      {/* Costs Breakdown */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Costs Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-secondary">Buyer Stamp Duty (BSD)</span>
              <span className="font-mono">{formatCurrency(results.bsd)}</span>
            </div>
            {results.absd > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary">ABSD</span>
                <span className="font-mono">{formatCurrency(results.absd)}</span>
              </div>
            )}
            {results.gst > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary">GST ({evaluation.property_type !== 'Residential' ? '9%' : 'N/A'})</span>
                <span className="font-mono">{formatCurrency(results.gst)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-secondary">Legal Conveyance Fee</span>
              <span className="font-mono">{formatCurrency(evaluation.legal_conveyance_fee)}</span>
            </div>
            {evaluation.bank_facilities_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary">Bank Facilities Fee</span>
                <span className="font-mono">{formatCurrency(evaluation.bank_facilities_fee)}</span>
              </div>
            )}
            {evaluation.insurance > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary">Insurance</span>
                <span className="font-mono">{formatCurrency(evaluation.insurance)}</span>
              </div>
            )}
            {evaluation.rental_agents_commission > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary">Rental Agent Commission</span>
                <span className="font-mono">{formatCurrency(evaluation.rental_agents_commission)}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-secondary">Downpayment</span>
              <span className="font-mono">{formatCurrency(evaluation.purchase_price * evaluation.downpayment_percent)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-secondary font-semibold">Total Costs</span>
              <span className="font-mono font-semibold">{formatCurrency(results.totalCosts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Total Costs (excluding GST)</span>
              <span className="font-mono">{formatCurrency(results.totalCostsWithoutGST)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-primary font-semibold">Initial Investment</span>
              <span className="font-mono font-bold text-accent">
                {formatCurrency(results.initialInvestmentWithoutGST)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Scenarios */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
           .Exit Scenarios
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('plan')}
              className={`btn ${activeView === 'plan' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Plan Exit Year
            </button>
            <button
              onClick={() => setActiveView('yearly')}
              className={`btn ${activeView === 'yearly' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Year-on-Year
            </button>
          </div>
        </div>

        {activeView === 'plan' ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="text-right">Conservative ({formatPercent(evaluation.conservative_growth)})</th>
                  <th className="text-right">Baseline ({formatPercent(evaluation.baseline_growth)})</th>
                  <th className="text-right">Target ({formatPercent(evaluation.target_growth)})</th>
                  <th className="text-right">Aggressive ({formatPercent(evaluation.aggressive_growth)})</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">Exit PSF</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.conservative.exitPSF, 2)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.baseline.exitPSF, 2)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.target.exitPSF, 2)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.aggressive.exitPSF, 2)}</td>
                </tr>
                <tr>
                  <td className="font-medium">Selling Price</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.conservative.sellingPrice)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.baseline.sellingPrice)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.target.sellingPrice)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.aggressive.sellingPrice)}</td>
                </tr>
                <tr>
                  <td className="font-medium">Outstanding Loan</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.conservative.outstandingLoan)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.baseline.outstandingLoan)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.target.outstandingLoan)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.aggressive.outstandingLoan)}</td>
                </tr>
                <tr>
                  <td className="font-medium">Selling Fees</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.conservative.sellingFees)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.baseline.sellingFees)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.target.sellingFees)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.aggressive.sellingFees)}</td>
                </tr>
                <tr>
                  <td className="font-medium">Net Capital Gain</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.conservative.netCapitalGain)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.baseline.netCapitalGain)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.target.netCapitalGain)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.aggressive.netCapitalGain)}</td>
                </tr>
                <tr>
                  <td className="font-medium">Total Pocket Money</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.conservative.totalPocketMoney)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.baseline.totalPocketMoney)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.target.totalPocketMoney)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.aggressive.totalPocketMoney)}</td>
                </tr>
                <tr className="bg-surface-subtle font-semibold">
                  <td>Total Profit</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.conservative.totalProfit)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.baseline.totalProfit)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.target.totalProfit)}</td>
                  <td className="text-right font-mono">{formatCurrency(results.scenarios.aggressive.totalProfit)}</td>
                </tr>
                <tr className="bg-surface-subtle font-semibold">
                  <td>ROI</td>
                  <td className="text-right">
                    <span className={`font-mono ${results.scenarios.conservative.roi >= 0.03 ? 'text-success' : 'text-error'}`}>
                      {formatPercent(results.scenarios.conservative.roi)}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`font-mono ${results.scenarios.baseline.roi >= 0.03 ? 'text-success' : 'text-error'}`}>
                      {formatPercent(results.scenarios.baseline.roi)}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`font-mono ${results.scenarios.target.roi >= 0.03 ? 'text-success' : 'text-error'}`}>
                      {formatPercent(results.scenarios.target.roi)}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`font-mono ${results.scenarios.aggressive.roi >= 0.03 ? 'text-success' : 'text-error'}`}>
                      {formatPercent(results.scenarios.aggressive.roi)}
                    </span>
                  </td>
                </tr>
                <tr className="bg-surface-subtle">
                  <td>ROI (Annualised)</td>
                  <td className="text-right font-mono">{formatPercent(results.scenarios.conservative.roiAnnualized)}</td>
                  <td className="text-right font-mono">{formatPercent(results.scenarios.baseline.roiAnnualized)}</td>
                  <td className="text-right font-mono">{formatPercent(results.scenarios.target.roiAnnualized)}</td>
                  <td className="text-right font-mono">{formatPercent(results.scenarios.aggressive.roiAnnualized)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-surface-subtle z-10">Exit Year</th>
                  <th colSpan={6} className="text-center border-l border-border">Conservative ({formatPercent(evaluation.conservative_growth)})</th>
                  <th colSpan={6} className="text-center border-l border-border">Baseline ({formatPercent(evaluation.baseline_growth)})</th>
                  <th colSpan={6} className="text-center border-l border-border">Target ({formatPercent(evaluation.target_growth)})</th>
                  <th colSpan={6} className="text-center border-l border-border">Aggressive ({formatPercent(evaluation.aggressive_growth)})</th>
                </tr>
                <tr>
                  <th className="sticky left-0 bg-surface-subtle z-10"></th>
                  {[...Array(4)].map((_, i) => (
                    <>
                      <th key={`group-${i}-0`} className="text-right border-l border-border">Price</th>
                      <th key={`group-${i}-1`} className="text-right">Gain</th>
                      <th key={`group-${i}-2`} className="text-right">Pocket</th>
                      <th key={`group-${i}-3`} className="text-right">Profit</th>
                      <th key={`group-${i}-4`} className="text-right">ROI</th>
                      <th key={`group-${i}-5`} className="text-right">Ann. ROI</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = i + 1
                  const isPlanYear = year === evaluation.plan_exit_year

                  // Recalculate for each year
                  const calculateForYear = (growthRate: number) => {
                    const purchasePSF = evaluation.purchase_price / evaluation.size_sqft
                    const exitPSF = purchasePSF * Math.pow(1 + growthRate, year)
                    const sellingPrice = exitPSF * evaluation.size_sqft
                    const outstandingLoan = results.loanAmount * (1 - (year / evaluation.loan_tenure_years))
                    const sellingFees = evaluation.legal_conveyance_fee + sellingPrice * 0.02
                    const netCapitalGain = sellingPrice - outstandingLoan - sellingFees - results.initialInvestmentWithoutGST
                    const totalPocketMoney = results.monthlyPocketMoney * year * 12
                    const totalProfit = netCapitalGain + totalPocketMoney
                    const roi = results.initialInvestmentWithoutGST > 0 ? totalProfit / results.initialInvestmentWithoutGST : 0
                    const roiAnnualized = year > 0 ? roi / year : 0

                    return { sellingPrice, netCapitalGain, totalPocketMoney, totalProfit, roi, roiAnnualized }
                  }

                  const cons = calculateForYear(evaluation.conservative_growth)
                  const base = calculateForYear(evaluation.baseline_growth)
                  const targ = calculateForYear(evaluation.target_growth)
                  const aggr = calculateForYear(evaluation.aggressive_growth)

                  const renderRow = (data: typeof cons) => (
                    <>
                      <td className="text-right font-mono border-l border-border">{formatCurrency(data.sellingPrice, 0)}</td>
                      <td className="text-right font-mono">{formatCurrency(data.netCapitalGain, 0)}</td>
                      <td className="text-right font-mono">{formatCurrency(data.totalPocketMoney, 0)}</td>
                      <td className="text-right font-mono">{formatCurrency(data.totalProfit, 0)}</td>
                      <td className="text-right">
                        <span className={`font-mono ${data.roi >= 0.03 ? 'text-success' : 'text-error'}`}>
                          {formatPercent(data.roi)}
                        </span>
                      </td>
                      <td className="text-right font-mono">{formatPercent(data.roiAnnualized)}</td>
                    </>
                  )

                  return (
                    <tr key={year} className={isPlanYear ? 'bg-accent-subtle font-semibold' : ''}>
                      <td className={`sticky left-0 z-10 font-mono ${isPlanYear ? 'bg-accent-subtle' : 'bg-surface'}`}>
                        Year {year}
                        {isPlanYear && <span className="ml-2 text-xs text-accent">PLAN</span>}
                      </td>
                      {renderRow(cons)}
                      {renderRow(base)}
                      {renderRow(targ)}
                      {renderRow(aggr)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JV Profit Distribution */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Profit Distribution (at Plan Exit Year)
        </h3>
        <div className="grid grid-cols-3 gap-6">
          {/* CI */}
          <div>
            <div className="mb-4">
              <p className="text-sm text-secondary">Cash Investor (CI)</p>
              <p className="text-xl font-bold text-accent">{formatPercent(evaluation.ci_percent)}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Share</span>
                <span className="font-mono">{formatCurrency(results.scenarios.baseline.totalProfit * evaluation.ci_percent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Per Lot ({evaluation.lot_size} lots)</span>
                <span className="font-mono">{formatCurrency((results.scenarios.baseline.totalProfit * evaluation.ci_percent) / evaluation.lot_size)}</span>
              </div>
            </div>
          </div>

          {/* DM */}
          <div>
            <div className="mb-4">
              <p className="text-sm text-secondary">Deal Maker (DM)</p>
              <p className="text-xl font-bold text-accent">{formatPercent(evaluation.dm_percent)}</p>
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Share</span>
                <span className="font-mono">{formatCurrency(results.scenarios.baseline.totalProfit * evaluation.dm_percent)}</span>
              </div>
            </div>
          </div>

          {/* LB */}
          <div>
            <div className="mb-4">
              <p className="text-sm text-secondary">Loan Bearer (LB)</p>
              <p className="text-xl font-bold text-accent">{formatPercent(evaluation.lb_percent)}</p>
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Share</span>
                <span className="font-mono">{formatCurrency(results.scenarios.baseline.totalProfit * evaluation.lb_percent)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Line Chart */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LineChart className="w-5 h-5" />
          ROI Trend (Year 1-10)
        </h3>
        <TrendLineChart
          evaluation={evaluation}
          initialInvestmentWithoutGST={results.initialInvestmentWithoutGST}
          height={350}
        />
      </div>

      {/* Property Details Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Property Details</h3>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-secondary">Property Type</span>
              <span className="font-medium">{evaluation.property_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Size</span>
              <span className="font-medium">{formatNumber(evaluation.size_sqft)} sqft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Lease Left</span>
              <span className="font-medium">{evaluation.lease_left} years</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-secondary">Interest Rate</span>
              <span className="font-mono">{formatPercent(evaluation.loan_interest_rate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Loan Tenure</span>
              <span className="font-medium">{evaluation.loan_tenure_years} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Downpayment</span>
              <span className="font-mono">{formatPercent(evaluation.downpayment_percent)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-secondary">Current Rental</span>
              <span className="font-mono">{formatCurrency(evaluation.rental_current)}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Property Tax</span>
              <span className="font-mono">{formatCurrency(evaluation.property_tax_monthly)}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">MCST</span>
              <span className="font-mono">{formatCurrency(evaluation.mcst_monthly)}/mo</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
