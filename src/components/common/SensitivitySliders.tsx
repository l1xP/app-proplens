import { useState, useEffect, useCallback } from 'react'
import { Sliders, RotateCcw } from 'lucide-react'
import type { Evaluation } from '../types/database'

interface SensitivitySlidersProps {
  evaluation: Evaluation
  onValuesChange: (modifiedEvaluation: Evaluation) => void
}

interface SliderConfig {
  key: keyof Evaluation
  label: string
  min: number
  max: number
  step: number
  unit: string
  format: 'currency' | 'percent' | 'years' | 'number'
}

const sliderConfigs: SliderConfig[] = [
  {
    key: 'purchase_price',
    label: 'Purchase Price',
    min: 100000,
    max: 5000000,
    step: 10000,
    unit: '',
    format: 'currency'
  },
  {
    key: 'rental_current',
    label: 'Monthly Rental',
    min: 1000,
    max: 50000,
    step: 100,
    unit: '',
    format: 'currency'
  },
  {
    key: 'loan_interest_rate',
    label: 'Interest Rate',
    min: 0.01,
    max: 0.08,
    step: 0.0025,
    unit: '%',
    format: 'percent'
  },
  {
    key: 'loan_tenure_years',
    label: 'Loan Tenure',
    min: 5,
    max: 35,
    step: 1,
    unit: ' years',
    format: 'years'
  },
  {
    key: 'downpayment_percent',
    label: 'Downpayment',
    min: 0.05,
    max: 0.90,
    step: 0.05,
    unit: '%',
    format: 'percent'
  },
  {
    key: 'conservative_growth',
    label: 'Conservative Growth',
    min: 0,
    max: 0.10,
    step: 0.005,
    unit: '%',
    format: 'percent'
  },
  {
    key: 'baseline_growth',
    label: 'Baseline Growth',
    min: 0,
    max: 0.12,
    step: 0.005,
    unit: '%',
    format: 'percent'
  },
  {
    key: 'target_growth',
    label: 'Target Growth',
    min: 0,
    max: 0.15,
    step: 0.005,
    unit: '%',
    format: 'percent'
  },
  {
    key: 'aggressive_growth',
    label: 'Aggressive Growth',
    min: 0,
    max: 0.20,
    step: 0.005,
    unit: '%',
    format: 'percent'
  }
]

export function SensitivitySliders({ evaluation, onValuesChange }: SensitivitySlidersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localValues, setLocalValues] = useState<Evaluation>(evaluation)
  const [originalValues] = useState<Evaluation>(evaluation)

  // Update local values when evaluation prop changes
  useEffect(() => {
    setLocalValues(evaluation)
  }, [evaluation])

  // Debounced update to parent
  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null
      return (updatedEvaluation: Evaluation) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onValuesChange(updatedEvaluation)
        }, 300)
      }
    })(),
    [onValuesChange]
  )

  const handleSliderChange = (key: keyof Evaluation, value: number) => {
    const updatedEvaluation = { ...localValues, [key]: value }
    setLocalValues(updatedEvaluation)
    debouncedUpdate(updatedEvaluation)
  }

  const handleReset = () => {
    setLocalValues(originalValues)
    onValuesChange(originalValues)
  }

  const formatValue = (value: number | undefined, format: string) => {
    if (value === undefined) return ''
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-SG', {
          style: 'currency',
          currency: 'SGD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value)
      case 'percent':
        return `${(value * 100).toFixed(2)}%`
      case 'years':
        return `${value} years`
      default:
        return value.toString()
    }
  }

  const getSliderValue = (value: number | undefined, format: string) => {
    return format === 'percent' ? (value || 0) * 100 : value || 0
  }

  const getActualValue = (sliderValue: number, format: string) => {
    return format === 'percent' ? sliderValue / 100 : sliderValue
  }

  const hasChanges = JSON.stringify(localValues) !== JSON.stringify(originalValues)

  return (
    <div className="card mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-0 bg-transparent border-0 text-left"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Sensitivity Analysis</h3>
          <span className="text-xs text-secondary">(What-If Scenarios)</span>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="badge badge-warning">Modified</span>
          )}
          <svg
            className={`w-5 h-5 text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <p className="text-sm text-secondary">
              Adjust sliders to simulate different scenarios. Results update in real-time.
            </p>
            {hasChanges && (
              <button
                onClick={handleReset}
                className="btn btn-ghost text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Original
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sliderConfigs.map((config) => {
              const value = localValues[config.key]
              const sliderValue = getSliderValue(value as number, config.format)
              const sliderMin = config.format === 'percent' ? config.min * 100 : config.min
              const sliderMax = config.format === 'percent' ? config.max * 100 : config.max
              const sliderStep = config.format === 'percent' ? config.step * 100 : config.step

              return (
                <div key={config.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-secondary">
                      {config.label}
                    </label>
                    <span className="text-sm font-semibold text-primary">
                      {formatValue(value as number, config.format)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={sliderMin}
                      max={sliderMax}
                      step={sliderStep}
                      value={sliderValue}
                      onChange={(e) => {
                        const actualValue = getActualValue(parseFloat(e.target.value), config.format)
                        handleSliderChange(config.key, actualValue)
                      }}
                      className="flex-1 h-2 bg-surface-subtle rounded-lg appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none
                                 [&::-webkit-slider-thumb]:w-4
                                 [&::-webkit-slider-thumb]:h-4
                                 [&::-webkit-slider-thumb]:rounded-full
                                 [&::-webkit-slider-thumb]:bg-primary
                                 [&::-webkit-slider-thumb]:cursor-pointer
                                 [&::-webkit-slider-thumb]:hover:bg-primary-hover
                                 [&::-moz-range-thumb]:w-4
                                 [&::-moz-range-thumb]:h-4
                                 [&::-moz-range-thumb]:rounded-full
                                 [&::-moz-range-thumb]:bg-primary
                                 [&::-moz-range-thumb]:cursor-pointer
                                 [&::-moz-range-thumb]:border-0"
                    />
                    <input
                      type="number"
                      value={sliderValue}
                      onChange={(e) => {
                        const actualValue = getActualValue(parseFloat(e.target.value) || 0, config.format)
                        handleSliderChange(config.key, actualValue)
                      }}
                      className="input w-24 text-right text-sm"
                      min={sliderMin}
                      max={sliderMax}
                      step={sliderStep}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-muted">
                    <span>{formatValue(config.min as number, config.format)}</span>
                    <span>{formatValue(config.max as number, config.format)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {hasChanges && (
            <div className="mt-6 pt-4 border-t border-border bg-warning-subtle -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
              <p className="text-sm text-warning">
                <strong>Note:</strong> These changes are temporary and not saved to the database.
                Click "Edit" to make permanent changes.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
