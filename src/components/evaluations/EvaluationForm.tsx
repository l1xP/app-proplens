import { useState, useEffect } from 'react'
import type { Evaluation, EvaluationInsert, PropertyType, LbProfile } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import {
  Building2,
  DollarSign,
  Percent,
  Calendar,
  Users,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Save,
  Calculator,
  Info
} from 'lucide-react'
import { calculateEvaluation, calculateSuggestedLTV, formatCurrency, formatPercent } from '../../lib/calculations'

interface EvaluationFormProps {
  evaluation?: Evaluation
  mode: 'create' | 'edit'
  onSave: (evaluation: Evaluation) => void
  onCancel: () => void
}

type Step = 'property' | 'financial' | 'costs' | 'rental' | 'jv' | 'growth'

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'property', label: 'Property Details', icon: <Building2 className="w-4 h-4" /> },
  { id: 'financial', label: 'Loan Terms', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'costs', label: 'Costs', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'rental', label: 'Rental Info', icon: <Calendar className="w-4 h-4" /> },
  { id: 'jv', label: 'JV Structure', icon: <Users className="w-4 h-4" /> },
  { id: 'growth', label: 'Growth Scenarios', icon: <TrendingUp className="w-4 h-4" /> },
]

const DEFAULT_VALUES: Partial<EvaluationInsert> = {
  property_type: 'Industrial',
  absd: false,
  gst_registered: true,
  lb_profile: 'IHC',
  loan_interest_rate: 0.025,
  loan_tenure_years: 30,
  downpayment_percent: 0.20,
  corp_sect_fee: 0,
  legal_conveyance_fee: 1500,
  selling_legal_conveyance_fee: 1500,
  legal_jv_fee: 0,
  bank_facilities_fee: 3600,
  insurance: 3500,
  rental_agents_commission: 0,
  backup_funds_months: 3,
  lot_size: 10,
  ci_percent: 0.40,
  dm_percent: 0.30,
  lb_percent: 0.30,
  plan_exit_year: 3,
  conservative_growth: 0.03,
  baseline_growth: 0.04,
  target_growth: 0.05,
  aggressive_growth: 0.06,
  status: 'Draft',
}

export function EvaluationForm({ evaluation, mode, onSave, onCancel }: EvaluationFormProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<Step>('property')
  const [loading, setLoading] = useState(false)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<EvaluationInsert>>({
    ...DEFAULT_VALUES,
    ...evaluation,
  })

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  useEffect(() => {
    if (evaluation) {
      setFormData({ ...evaluation })
    }
  }, [evaluation])

  const updateField = (field: keyof EvaluationInsert, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
    }
  }

  const handlePrev = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    const saveData = { ...formData, status: 'Draft' }

    if (mode === 'edit' && evaluation) {
      const { data, error } = await supabase
        .from('evaluations')
        .update(saveData)
        .eq('id', evaluation.id)
        .select()
        .single()

      if (!error && data) {
        onSave(data)
      }
    } else {
      const { data, error } = await supabase
        .from('evaluations')
        .insert({ ...saveData, user_id: user!.id })
        .select()
        .single()

      if (!error && data) {
        onSave(data)
      }
    }
    setLoading(false)
  }

  const handleCalculate = async () => {
    setLoading(true)
    const saveData = { ...formData, status: 'Complete' }

    if (mode === 'edit' && evaluation) {
      const { data, error } = await supabase
        .from('evaluations')
        .update(saveData)
        .eq('id', evaluation.id)
        .select()
        .single()

      if (!error && data) {
        onSave(data)
      }
    } else {
      const { data, error } = await supabase
        .from('evaluations')
        .insert({ ...saveData, user_id: user!.id })
        .select()
        .single()

      if (!error && data) {
        onSave(data)
      }
    }
    setLoading(false)
  }

  const suggestedLTV = calculateSuggestedLTV(
    formData.property_type as PropertyType,
    formData.lb_profile as LbProfile
  )

  // Update downpayment when LTV suggestion changes
  useEffect(() => {
    if (mode === 'create') {
      updateField('downpayment_percent', 1 - suggestedLTV)
    }
  }, [formData.property_type, formData.lb_profile, mode])

  const renderStep = () => {
    switch (currentStep) {
      case 'property':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="property_name" className="label">
                Property Name <span className="text-error">*</span>
              </label>
              <input
                id="property_name"
                type="text"
                value={formData.property_name || ''}
                onChange={(e) => updateField('property_name', e.target.value)}
                className="input"
                placeholder="e.g., Woodlands 11"
                required
              />
            </div>

            <div>
              <label htmlFor="property_address" className="label">
                Property Address
              </label>
              <input
                id="property_address"
                type="text"
                value={formData.property_address || ''}
                onChange={(e) => updateField('property_address', e.target.value)}
                className="input"
                placeholder="e.g., 11 Woodlands Close #05-52"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="property_type" className="label">
                  Property Type <span className="text-error">*</span>
                </label>
                <select
                  id="property_type"
                  value={formData.property_type || 'Industrial'}
                  onChange={(e) => updateField('property_type', e.target.value as PropertyType)}
                  className="input select"
                >
                  <option value="Residential">Residential</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label htmlFor="lb_profile" className="label">
                  LB Profile <span className="text-error">*</span>
                </label>
                <select
                  id="lb_profile"
                  value={formData.lb_profile || 'IHC'}
                  onChange={(e) => updateField('lb_profile', e.target.value as LbProfile)}
                  className="input select"
                >
                  <option value="Individual">Individual</option>
                  <option value="IHC">IHC</option>
                  <option value="Operating">Operating</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="size_sqft" className="label">
                  Size (sq ft) <span className="text-error">*</span>
                </label>
                <input
                  id="size_sqft"
                  type="number"
                  value={formData.size_sqft || ''}
                  onChange={(e) => updateField('size_sqft', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="e.g., 1830"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div>
                <label htmlFor="lease_left" className="label">
                  Lease Remaining (years) <span className="text-error">*</span>
                </label>
                <input
                  id="lease_left"
                  type="number"
                  value={formData.lease_left || ''}
                  onChange={(e) => updateField('lease_left', parseInt(e.target.value) || 0)}
                  className="input"
                  placeholder="e.g., 30"
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="purchase_price" className="label">
                Purchase Price (SGD) <span className="text-error">*</span>
              </label>
              <input
                id="purchase_price"
                type="number"
                value={formData.purchase_price || ''}
                onChange={(e) => updateField('purchase_price', parseFloat(e.target.value) || 0)}
                className="input"
                placeholder="e.g., 1010000"
                min="0"
                step="1"
                required
              />
              {formData.purchase_price && formData.size_sqft && (
                <p className="text-sm text-secondary mt-2">
                  Purchase PSF: {formatCurrency(formData.purchase_price / formData.size_sqft, 2)}/sqft
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="market_valuation" className="label">
                  Market Valuation
                </label>
                <input
                  id="market_valuation"
                  type="number"
                  value={formData.market_valuation || ''}
                  onChange={(e) => updateField('market_valuation', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="e.g., 1050000"
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label htmlFor="bank_valuation" className="label">
                  Bank Valuation
                </label>
                <input
                  id="bank_valuation"
                  type="number"
                  value={formData.bank_valuation || ''}
                  onChange={(e) => updateField('bank_valuation', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="e.g., 1000000"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  id="absd"
                  type="checkbox"
                  checked={formData.absd || false}
                  onChange={(e) => updateField('absd', e.target.checked)}
                  className="w-5 h-5 rounded border-border"
                />
                <label htmlFor="absd" className="label mb-0 cursor-pointer">
                  ABSD Applicable
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="gst_registered"
                  type="checkbox"
                  checked={formData.gst_registered || false}
                  onChange={(e) => updateField('gst_registered', e.target.checked)}
                  disabled={formData.property_type === 'Residential'}
                  className="w-5 h-5 rounded border-border"
                />
                <label htmlFor="gst_registered" className="label mb-0 cursor-pointer">
                  Seller GST-Registered
                </label>
              </div>
            </div>

            {formData.property_type === 'Residential' && (
              <div className="bg-info-subtle border border-info rounded-md p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-info">Residential Property</p>
                    <p className="text-sm text-secondary mt-1">
                      GST is not applicable to Residential properties. The GST-registered option has been disabled.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'financial':
        return (
          <div className="space-y-6">
            <div className="bg-surface-subtle border border-border rounded-lg p-4">
              <p className="text-sm text-secondary">
                <span className="font-semibold text-textPrimary">Suggested LTV:</span>{' '}
                {formatPercent(suggestedLTV)} based on {formData.lb_profile} + {formData.property_type}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="loan_interest_rate" className="label">
                  Interest Rate (annual) <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="loan_interest_rate"
                    type="number"
                    value={(formData.loan_interest_rate || 0) * 100}
                    onChange={(e) => updateField('loan_interest_rate', parseFloat(e.target.value) / 100 || 0)}
                    className="input pr-8"
                    placeholder="2.5"
                    min="0"
                    max="20"
                    step="0.1"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span>
                </div>
              </div>

              <div>
                <label htmlFor="loan_tenure_years" className="label">
                  Loan Tenure (years) <span className="text-error">*</span>
                </label>
                <input
                  id="loan_tenure_years"
                  type="number"
                  value={formData.loan_tenure_years || ''}
                  onChange={(e) => updateField('loan_tenure_years', parseInt(e.target.value) || 0)}
                  className="input"
                  placeholder="30"
                  min="1"
                  max="35"
                  step="1"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="downpayment_percent" className="label">
                Downpayment % <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="downpayment_percent"
                  type="number"
                  value={(formData.downpayment_percent || 0) * 100}
                  onChange={(e) => updateField('downpayment_percent', parseFloat(e.target.value) / 100 || 0)}
                  className="input pr-8"
                  placeholder="20"
                  min="5"
                  max="100"
                  step="1"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span>
              </div>
              {formData.purchase_price && formData.downpayment_percent && (
                <p className="text-sm text-secondary mt-2">
                  Downpayment: {formatCurrency(formData.purchase_price * formData.downpayment_percent)} |
                  Loan Amount: {formatCurrency(formData.purchase_price * (1 - formData.downpayment_percent))}
                </p>
              )}
            </div>
          </div>
        )

      case 'costs':
        return (
          <div className="space-y-6">
            <div className="bg-surface-subtle border border-border rounded-lg p-4">
              <p className="text-sm text-secondary">
                Stamp duties (BSD, ABSD) will be auto-calculated based on purchase price and buyer profile.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="corp_sect_fee" className="label">
                  Corp Sect Fee
                </label>
                <input
                  id="corp_sect_fee"
                  type="number"
                  value={formData.corp_sect_fee || ''}
                  onChange={(e) => updateField('corp_sect_fee', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label htmlFor="legal_conveyance_fee" className="label">
                  Legal Conveyance Fee (Purchase)
                </label>
                <input
                  id="legal_conveyance_fee"
                  type="number"
                  value={formData.legal_conveyance_fee || ''}
                  onChange={(e) => updateField('legal_conveyance_fee', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="1500"
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label htmlFor="selling_legal_conveyance_fee" className="label">
                  Legal Conveyance Fee (Selling)
                </label>
                <input
                  id="selling_legal_conveyance_fee"
                  type="number"
                  value={formData.selling_legal_conveyance_fee || ''}
                  onChange={(e) => updateField('selling_legal_conveyance_fee', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="1500"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="legal_jv_fee" className="label">
                  Legal JV Fee
                </label>
                <input
                  id="legal_jv_fee"
                  type="number"
                  value={formData.legal_jv_fee || ''}
                  onChange={(e) => updateField('legal_jv_fee', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label htmlFor="bank_facilities_fee" className="label">
                  Bank Facilities Fee
                </label>
                <input
                  id="bank_facilities_fee"
                  type="number"
                  value={formData.bank_facilities_fee || ''}
                  onChange={(e) => updateField('bank_facilities_fee', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="3600"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="insurance" className="label">
                  Insurance
                </label>
                <input
                  id="insurance"
                  type="number"
                  value={formData.insurance || ''}
                  onChange={(e) => updateField('insurance', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="3500"
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label htmlFor="backup_funds_months" className="label">
                  Backup Funds (months)
                </label>
                <input
                  id="backup_funds_months"
                  type="number"
                  value={formData.backup_funds_months || ''}
                  onChange={(e) => updateField('backup_funds_months', parseInt(e.target.value) || 0)}
                  className="input"
                  placeholder="3"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div>
              <div className="flex items-start gap-2">
                <label htmlFor="rental_agents_commission" className="label mt-0.5">
                  Rental Agent Commission
                </label>
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip('rental_agent')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="text-muted hover:text-accent"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showTooltip === 'rental_agent' && (
                  <div className="absolute left-0 mt-8 w-80 p-3 bg-surface-elevated border border-border rounded-lg shadow-lg z-10">
                    <p className="text-sm text-secondary">
                      One-time upfront cost paid at lease signing. Formula: Monthly Rental × No. of Years (1 month per year is typical).
                    </p>
                  </div>
                )}
              </div>
              <input
                id="rental_agents_commission"
                type="number"
                value={formData.rental_agents_commission || ''}
                onChange={(e) => updateField('rental_agents_commission', parseFloat(e.target.value) || 0)}
                className="input"
                placeholder="e.g. Monthly Rental × No. of Years (1 month per year is typical)"
                min="0"
                step="1"
              />
            </div>
          </div>
        )

      case 'rental':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rental_current" className="label">
                  Current Rental (monthly) <span className="text-error">*</span>
                </label>
                <input
                  id="rental_current"
                  type="number"
                  value={formData.rental_current || ''}
                  onChange={(e) => updateField('rental_current', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="e.g., 8500"
                  min="0"
                  step="100"
                  required
                />
              </div>

              <div>
                <label htmlFor="rental_expected" className="label">
                  Expected Rental (optional)
                </label>
                <input
                  id="rental_expected"
                  type="number"
                  value={formData.rental_expected || ''}
                  onChange={(e) => updateField('rental_expected', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="e.g., 9000"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="property_tax_monthly" className="label">
                  Property Tax (monthly) <span className="text-error">*</span>
                </label>
                <input
                  id="property_tax_monthly"
                  type="number"
                  value={formData.property_tax_monthly || ''}
                  onChange={(e) => updateField('property_tax_monthly', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="e.g., 200"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div>
                <label htmlFor="mcst_monthly" className="label">
                  MCST/Maintenance (monthly) <span className="text-error">*</span>
                </label>
                <input
                  id="mcst_monthly"
                  type="number"
                  value={formData.mcst_monthly || ''}
                  onChange={(e) => updateField('mcst_monthly', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="e.g., 300"
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>
          </div>
        )

      case 'jv':
        return (
          <div className="space-y-6">
            <div className="bg-surface-subtle border border-border rounded-lg p-4">
              <p className="text-sm text-secondary">
                For solo investment, set CI = 100%, DM = 0%, LB = 0%
              </p>
            </div>

            <div>
              <label htmlFor="lot_size" className="label">
                Lot Size <span className="text-error">*</span>
              </label>
              <input
                id="lot_size"
                type="number"
                value={formData.lot_size || ''}
                onChange={(e) => updateField('lot_size', parseInt(e.target.value) || 0)}
                className="input"
                placeholder="e.g., 10"
                min="1"
                step="1"
                required
              />
              <p className="text-sm text-secondary mt-2">
                Number of lots for Cash Investor distribution
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="ci_percent" className="label">
                  CI % <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="ci_percent"
                    type="number"
                    value={(formData.ci_percent || 0) * 100}
                    onChange={(e) => updateField('ci_percent', parseFloat(e.target.value) / 100 || 0)}
                    className="input pr-8"
                    placeholder="40"
                    min="0"
                    max="100"
                    step="1"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span>
                </div>
              </div>

              <div>
                <label htmlFor="dm_percent" className="label">
                  DM % <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="dm_percent"
                    type="number"
                    value={(formData.dm_percent || 0) * 100}
                    onChange={(e) => updateField('dm_percent', parseFloat(e.target.value) / 100 || 0)}
                    className="input pr-8"
                    placeholder="30"
                    min="0"
                    max="100"
                    step="1"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span>
                </div>
              </div>

              <div>
                <label htmlFor="lb_percent" className="label">
                  LB % <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="lb_percent"
                    type="number"
                    value={(formData.lb_percent || 0) * 100}
                    onChange={(e) => updateField('lb_percent', parseFloat(e.target.value) / 100 || 0)}
                    className="input pr-8"
                    placeholder="30"
                    min="0"
                    max="100"
                    step="1"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span>
                </div>
              </div>
            </div>

            {formData.ci_percent && formData.dm_percent && formData.lb_percent && (
              <div className="bg-surface-subtle border border-border rounded-lg p-4">
                <p className="text-sm">
                  <span className="font-semibold text-textPrimary">Total:</span>{' '}
                  <span className={
                    Math.abs((formData.ci_percent + formData.dm_percent + formData.lb_percent) - 1) < 0.001
                      ? 'text-success'
                      : 'text-error'
                  }>
                    {((formData.ci_percent + formData.dm_percent + formData.lb_percent) * 100).toFixed(0)}%
                  </span>
                  {Math.abs((formData.ci_percent + formData.dm_percent + formData.lb_percent) - 1) >= 0.001 && (
                    <span className="text-error ml-2">(must equal 100%)</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )

      case 'growth':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="plan_exit_year" className="label">
                Plan Exit Year <span className="text-error">*</span>
              </label>
              <input
                id="plan_exit_year"
                type="number"
                value={formData.plan_exit_year || ''}
                onChange={(e) => updateField('plan_exit_year', parseInt(e.target.value) || 0)}
                className="input"
                placeholder="e.g., 3"
                min="1"
                max="10"
                step="1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="conservative_growth" className="label">
                  Conservative Growth <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="conservative_growth"
                    type="number"
                    value={(formData.conservative_growth || 0) * 100}
                    onChange={(e) => updateField('conservative_growth', parseFloat(e.target.value) / 100 || 0)}
                    className="input pr-8"
                    placeholder="3"
                    min="-5"
                    max="20"
                    step="0.5"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span>
                </div>
              </div>

              <div>
                <label htmlFor="baseline_growth" className="label">
                  Baseline Growth <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="baseline_growth"
                    type="number"
                    value={(formData.baseline_growth || 0) * 100}
                    onChange={(e) => updateField('baseline_growth', parseFloat(e.target.value) / 100 || 0)}
                    className="input pr-8"
                    placeholder="4"
                    min="-5"
                    max="20"
                    step="0.5"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="target_growth" className="label">
                  Target Growth <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="target_growth"
                    type="number"
                    value={(formData.target_growth || 0) * 100}
                    onChange={(e) => updateField('target_growth', parseFloat(e.target.value) / 100 || 0)}
                    className="input pr-8"
                    placeholder="5"
                    min="-5"
                    max="20"
                    step="0.5"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span>
                </div>
              </div>

              <div>
                <label htmlFor="aggressive_growth" className="label">
                  Aggressive Growth <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="aggressive_growth"
                    type="number"
                    value={(formData.aggressive_growth || 0) * 100}
                    onChange={(e) => updateField('aggressive_growth', parseFloat(e.target.value) / 100 || 0)}
                    className="input pr-8"
                    placeholder="6"
                    min="-5"
                    max="20"
                    step="0.5"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    // Basic validation - check required fields based on step
    switch (currentStep) {
      case 'property':
        return !!(formData.property_name && formData.property_type && formData.size_sqft &&
                 formData.lease_left && formData.purchase_price && formData.lb_profile)
      case 'financial':
        return !!(formData.loan_interest_rate && formData.loan_tenure_years && formData.downpayment_percent)
      case 'rental':
        return !!(formData.rental_current && formData.property_tax_monthly && formData.mcst_monthly)
      case 'jv':
        return !!(formData.lot_size && formData.ci_percent !== undefined &&
                 formData.dm_percent !== undefined && formData.lb_percent !== undefined)
      case 'growth':
        return !!(formData.plan_exit_year && formData.conservative_growth !== undefined &&
                 formData.baseline_growth !== undefined && formData.target_growth !== undefined &&
                 formData.aggressive_growth !== undefined)
      default:
        return true
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex-1 flex items-center">
              <button
                onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  currentStep === step.id
                    ? 'bg-accent-subtle text-accent'
                    : index < currentStepIndex
                    ? 'text-success'
                    : 'text-muted'
                }`}
                disabled={index > currentStepIndex}
              >
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                    currentStep === step.id
                      ? 'bg-accent text-textInverse'
                      : index < currentStepIndex
                      ? 'bg-success text-white'
                      : 'bg-surface-subtle text-muted'
                  }`}
                >
                  {index < currentStepIndex ? '✓' : index + 1}
                </span>
                <span className="hidden md:inline">{step.label}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-success' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form content */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          {STEPS[currentStepIndex].icon}
          {STEPS[currentStepIndex].label}
        </h2>
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={currentStepIndex === 0 ? onCancel : handlePrev}
          className="btn btn-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
          {currentStepIndex === 0 ? 'Cancel' : 'Previous'}
        </button>

        <div className="flex gap-3">
          <button
            onClick={handleSaveDraft}
            className="btn btn-ghost"
            disabled={loading}
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>

          {currentStepIndex === STEPS.length - 1 ? (
            <button
              onClick={handleCalculate}
              className="btn btn-primary"
              disabled={loading || !canProceed()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Calculate & Save
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="btn btn-primary"
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
