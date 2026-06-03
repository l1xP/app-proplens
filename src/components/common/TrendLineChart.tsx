import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Evaluation } from '../../types/database'
import {
  calculateOutstandingLoan,
  calculateMonthlyMortgage,
  calculateMonthlyPocketMoney
} from '../../lib/calculations'

interface TrendLineChartProps {
  evaluation: Evaluation
  initialInvestmentWithoutGST: number
  height?: number
}

export function TrendLineChart({ evaluation, initialInvestmentWithoutGST, height = 400 }: TrendLineChartProps) {
  const loanAmount = evaluation.purchase_price * (1 - evaluation.downpayment_percent)
  const monthlyMortgage = calculateMonthlyMortgage(
    loanAmount,
    evaluation.loan_interest_rate,
    evaluation.loan_tenure_years
  )
  const rental = evaluation.rental_expected > 0 ? evaluation.rental_expected : evaluation.rental_current
  const monthlyPocketMoney = calculateMonthlyPocketMoney(
    rental,
    monthlyMortgage,
    evaluation.property_tax_monthly,
    evaluation.mcst_monthly
  )

  const purchasePSF = evaluation.purchase_price / evaluation.size_sqft

  function calculateROIForYear(year: number, growthRate: number) {
    const exitPSF = purchasePSF * Math.pow(1 + growthRate, year)
    const sellingPrice = exitPSF * evaluation.size_sqft
    const outstandingLoan = calculateOutstandingLoan(
      loanAmount,
      evaluation.loan_interest_rate,
      evaluation.loan_tenure_years,
      year
    )
    const sellingFees = evaluation.legal_conveyance_fee + sellingPrice * 0.02
    const netCapitalGain = sellingPrice - outstandingLoan - sellingFees - initialInvestmentWithoutGST
    const totalPocketMoney = monthlyPocketMoney * year * 12
    const totalProfit = netCapitalGain + totalPocketMoney
    const roi = initialInvestmentWithoutGST > 0 ? totalProfit / initialInvestmentWithoutGST : 0
    return roi
  }

  const data = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1
    return {
      year: `Year ${year}`,
      conservative: calculateROIForYear(year, evaluation.conservative_growth) * 100,
      baseline: calculateROIForYear(year, evaluation.baseline_growth) * 100,
      target: calculateROIForYear(year, evaluation.target_growth) * 100,
      aggressive: calculateROIForYear(year, evaluation.aggressive_growth) * 100,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#223041" />
        <XAxis
          dataKey="year"
          stroke="#A9B4C0"
          tick={{ fill: '#A9B4C0', fontSize: 12 }}
        />
        <YAxis
          stroke="#A9B4C0"
          tick={{ fill: '#A9B4C0', fontSize: 12 }}
          tickFormatter={(value) => `${value.toFixed(0)}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#16202B',
            border: '1px solid #223041',
            borderRadius: '10px',
            color: '#EAF0F7',
          }}
          formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
        />
        <Legend
          wrapperStyle={{ color: '#EAF0F7' }}
        />
        <Line
          type="monotone"
          dataKey="conservative"
          name="Conservative"
          stroke="#60A5FA"
          strokeWidth={2}
          dot={{ fill: '#60A5FA', r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="baseline"
          name="Baseline"
          stroke="#2DD4BF"
          strokeWidth={2}
          dot={{ fill: '#2DD4BF', r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="target"
          name="Target"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={{ fill: '#F59E0B', r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="aggressive"
          name="Aggressive"
          stroke="#EF4444"
          strokeWidth={2}
          dot={{ fill: '#EF4444', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
