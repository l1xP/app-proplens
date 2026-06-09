import type { Evaluation, PropertyType, LbProfile } from '../types/database'

interface BSDTier {
  min: number
  max: number | null
  rate: number
}

interface ScenarioResult {
  exitYear: number
  growthRate: number
  exitPSF: number
  sellingPrice: number
  outstandingLoan: number
  sellingFees: number
  agentCommission: number
  legalConveyanceFee: number
  netCapitalGain: number
  totalPocketMoney: number
  totalProfit: number
  roi: number
  roiAnnualized: number
}

interface CalculationResults {
  bsd: number
  absd: number
  gst: number
  gstRefundable: number
  totalCosts: number
  totalCostsWithoutGST: number
  initialInvestment: number
  initialInvestmentWithoutGST: number
  ciInvestment: number
  loanAmount: number
  monthlyMortgage: number
  monthlyPocketMoney: number
  purchasePSF: number
  marketPSF: number
  suggestedLTV: number
  scenarios: {
    conservative: ScenarioResult
    baseline: ScenarioResult
    target: ScenarioResult
    aggressive: ScenarioResult
  }
  investableDecision: string
  investableScore: number
}

const GST_RATE = 0.09
const AGENT_SELLING_COMMISSION_RATE = 0.02
const ROI_THRESHOLD = 0.03

/**
 * Calculate Buyer Stamp Duty (BSD) using IRAS tiered rates
 * Tiers:
 * - First $180,000: 1%
 * - Next $180,000: 2%
 * - Next $640,000: 3%
 * - Next $500,000: 4%
 * - Next $1,500,000: 5%
 * - Above $3,000,000: 6%
 */
export function calculateBSD(purchasePrice: number): number {
  const tiers: BSDTier[] = [
    { min: 0, max: 180000, rate: 0.01 },
    { min: 180000, max: 360000, rate: 0.02 },
    { min: 360000, max: 1000000, rate: 0.03 },
    { min: 1000000, max: 1500000, rate: 0.04 },
    { min: 1500000, max: 3000000, rate: 0.05 },
    { min: 3000000, max: null, rate: 0.06 },
  ]

  let bsd = 0

  for (const tier of tiers) {
    if (purchasePrice <= tier.min) break

    const upperBound = tier.max === null ? purchasePrice : Math.min(purchasePrice, tier.max)
    const taxableAmount = upperBound - tier.min
    bsd += taxableAmount * tier.rate
  }

  return bsd
}

/**
 * Calculate Additional Buyer Stamp Duty (ABSD)
 * This is a simplified version - in reality, ABSD depends on buyer profile and property count
 * For now, we use the absd flag from evaluation
 */
export function calculateABSD(purchasePrice: number, hasABSD: boolean): number {
  if (!hasABSD) return 0

  // Using 17% as default for citizen second property (most common case)
  // In real implementation, this would be fetched from tax_formulas table
  const absdRate = 0.17
  return purchasePrice * absdRate
}

/**
 * Calculate GST (9% on Industrial/Commercial properties only)
 * GST is NOT charged on Residential properties
 */
export function calculateGST(
  purchasePrice: number,
  propertyType: PropertyType,
  sellerGSTRegistered: boolean
): number {
  if (propertyType === 'Residential') return 0
  if (!sellerGSTRegistered) return 0

  return purchasePrice * GST_RATE
}

/**
 * Calculate GST refund amount if buyer is GST-registered
 */
export function calculateGSTRefund(
  gstAmount: number,
  buyerGSTRegistered: boolean,
  lbProfile: LbProfile
): number {
  // Individual cannot be GST-registered
  if (lbProfile === 'Individual') return 0
  if (!buyerGSTRegistered) return 0

  return gstAmount
}

/**
 * Calculate suggested Loan-to-Value (LTV) based on LB Profile and Property Type
 */
export function calculateSuggestedLTV(propertyType: PropertyType, lbProfile: LbProfile): number {
  // Individual + Residential: 75%
  if (lbProfile === 'Individual' && propertyType === 'Residential') {
    return 0.75
  }

  // Individual + Industrial/Commercial: 80%
  if (lbProfile === 'Individual' && (propertyType === 'Industrial' || propertyType === 'Commercial')) {
    return 0.80
  }

  // IHC + Industrial/Commercial: 80% (IHC cannot purchase Residential)
  if (lbProfile === 'IHC') {
    return 0.80
  }

  // Operating + Industrial/Commercial: 90% (Operating cannot purchase Residential)
  if (lbProfile === 'Operating') {
    return 0.90
  }

  return 0.75
}

/**
 * Calculate monthly mortgage payment using PMT formula
 * PMT(rate, nper, pv)
 * rate = interest_rate / 12
 * nper = tenure_years * 12
 * pv = -loan_amount
 */
export function calculateMonthlyMortgage(
  loanAmount: number,
  interestRate: number,
  tenureYears: number
): number {
  const monthlyRate = interestRate / 12
  const totalPayments = tenureYears * 12

  if (monthlyRate === 0) {
    return loanAmount / totalPayments
  }

  const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)
  const denominator = Math.pow(1 + monthlyRate, totalPayments) - 1

  return numerator / denominator
}

/**
 * Calculate outstanding loan balance after N years
 * Uses standard amortization formula
 */
export function calculateOutstandingLoan(
  loanAmount: number,
  interestRate: number,
  tenureYears: number,
  yearsElapsed: number
): number {
  const monthlyRate = interestRate / 12
  const totalPayments = tenureYears * 12
  const paymentsMade = yearsElapsed * 12

  if (monthlyRate === 0) {
    return loanAmount * (1 - paymentsMade / totalPayments)
  }

  const monthlyPayment = calculateMonthlyMortgage(loanAmount, interestRate, tenureYears)

  // Future value of loan amount
  const fvLoan = loanAmount * Math.pow(1 + monthlyRate, paymentsMade)

  // Future value of payments made
  const fvPayments =
    monthlyRate > 0
      ? monthlyPayment * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate)
      : monthlyPayment * paymentsMade

  return Math.max(0, fvLoan - fvPayments)
}

/**
 * Calculate monthly pocket money
 * Rental - (Mortgage + Property Tax + MCST/Maintenance)
 */
export function calculateMonthlyPocketMoney(
  rental: number,
  monthlyMortgage: number,
  propertyTax: number,
  mcst: number
): number {
  return rental - monthlyMortgage - propertyTax - mcst
}

/**
 * Calculate single scenario result for a given exit year
 */
function calculateScenario(
  evaluation: Evaluation,
  exitYear: number,
  growthRate: number,
  initialInvestmentWithoutGST: number
): ScenarioResult {
  const purchasePSF = evaluation.purchase_price / evaluation.size_sqft
  const exitPSF = purchasePSF * Math.pow(1 + growthRate, exitYear)
  const sellingPrice = exitPSF * evaluation.size_sqft

  const outstandingLoan = calculateOutstandingLoan(
    evaluation.purchase_price * (1 - evaluation.downpayment_percent),
    evaluation.loan_interest_rate,
    evaluation.loan_tenure_years,
    exitYear
  )

  const sellingFees = evaluation.selling_legal_conveyance_fee + sellingPrice * AGENT_SELLING_COMMISSION_RATE
  const agentCommission = sellingPrice * AGENT_SELLING_COMMISSION_RATE
  const legalConveyanceFee = evaluation.selling_legal_conveyance_fee

  // Net Capital Gain calculation
  const netCapitalGain =
    sellingPrice - outstandingLoan - sellingFees - initialInvestmentWithoutGST

  // Monthly pocket money
  const monthlyMortgage = calculateMonthlyMortgage(
    evaluation.purchase_price * (1 - evaluation.downpayment_percent),
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

  const totalPocketMoney = monthlyPocketMoney * exitYear * 12
  const totalProfit = netCapitalGain + totalPocketMoney

  const roi = initialInvestmentWithoutGST > 0 ? totalProfit / initialInvestmentWithoutGST : 0
  const roiAnnualized = exitYear > 0 ? roi / exitYear : 0

  return {
    exitYear,
    growthRate,
    exitPSF,
    sellingPrice,
    outstandingLoan,
    sellingFees,
    agentCommission,
    legalConveyanceFee,
    netCapitalGain,
    totalPocketMoney,
    totalProfit,
    roi,
    roiAnnualized,
  }
}

/**
 * Main calculation function
 * Computes all derived values for an evaluation
 */
export function calculateEvaluation(evaluation: Evaluation): CalculationResults {
  // BSD
  const bsd = calculateBSD(evaluation.purchase_price)

  // ABSD (simplified - uses flag)
  const absd = calculateABSD(evaluation.purchase_price, evaluation.absd)

  // GST
  const gst = calculateGST(evaluation.purchase_price, evaluation.property_type, evaluation.gst_registered)

  // GST Refund
  const gstRefundable = calculateGSTRefund(gst, evaluation.gst_registered, evaluation.lb_profile)

  // Total Costs (including GST)
  const totalCosts =
    bsd +
    absd +
    gst +
    evaluation.corp_sect_fee +
    evaluation.legal_conveyance_fee +
    evaluation.legal_jv_fee +
    evaluation.bank_facilities_fee +
    evaluation.insurance +
    evaluation.rental_agents_commission

  // Total Costs without GST (for initial investment calculation)
  const totalCostsWithoutGST =
    bsd +
    absd +
    evaluation.corp_sect_fee +
    evaluation.legal_conveyance_fee +
    evaluation.legal_jv_fee +
    evaluation.bank_facilities_fee +
    evaluation.insurance +
    evaluation.rental_agents_commission

  // Downpayment
  const downpayment = evaluation.purchase_price * evaluation.downpayment_percent

  // Initial Investment (includes GST if not refundable)
  const initialInvestment = downpayment + totalCosts - gstRefundable
  const initialInvestmentWithoutGST = downpayment + totalCostsWithoutGST

  // CI provides all the upfront cash (downpayment + costs), excluding the GST portion
  const ciInvestment = initialInvestmentWithoutGST

  // Loan Amount
  const loanAmount = evaluation.purchase_price * (1 - evaluation.downpayment_percent)

  // Monthly Mortgage
  const monthlyMortgage = calculateMonthlyMortgage(
    loanAmount,
    evaluation.loan_interest_rate,
    evaluation.loan_tenure_years
  )

  // Monthly Pocket Money
  const rental = evaluation.rental_expected > 0 ? evaluation.rental_expected : evaluation.rental_current
  const monthlyPocketMoney = calculateMonthlyPocketMoney(
    rental,
    monthlyMortgage,
    evaluation.property_tax_monthly,
    evaluation.mcst_monthly
  )

  // PSF calculations
  const purchasePSF = evaluation.purchase_price / evaluation.size_sqft
  const marketPSF = evaluation.market_valuation > 0 ? evaluation.market_valuation / evaluation.size_sqft : 0

  // Suggested LTV
  const suggestedLTV = calculateSuggestedLTV(evaluation.property_type, evaluation.lb_profile)

  // Calculate all 4 scenarios
  const conservativeResult = calculateScenario(
    evaluation,
    evaluation.plan_exit_year,
    evaluation.conservative_growth,
    initialInvestmentWithoutGST
  )

  const baselineResult = calculateScenario(
    evaluation,
    evaluation.plan_exit_year,
    evaluation.baseline_growth,
    initialInvestmentWithoutGST
  )

  const targetResult = calculateScenario(
    evaluation,
    evaluation.plan_exit_year,
    evaluation.target_growth,
    initialInvestmentWithoutGST
  )

  const aggressiveResult = calculateScenario(
    evaluation,
    evaluation.plan_exit_year,
    evaluation.aggressive_growth,
    initialInvestmentWithoutGST
  )

  // Investable decision logic
  const scenarios = [conservativeResult, baselineResult, targetResult, aggressiveResult]
  const passingScenarios = scenarios.filter((s) => s.roi >= ROI_THRESHOLD).length

  let investableDecision: string
  let investableScore: number

  if (passingScenarios === 4) {
    investableDecision = 'Resounding Pass'
    investableScore = 4
  } else if (passingScenarios === 3) {
    investableDecision = 'Proceed'
    investableScore = 3
  } else if (passingScenarios === 2) {
    investableDecision = 'Proceed with Caution'
    investableScore = 2
  } else {
    investableDecision = 'Resounding No'
    investableScore = passingScenarios
  }

  return {
    bsd,
    absd,
    gst,
    gstRefundable,
    totalCosts,
    totalCostsWithoutGST,
    initialInvestment,
    initialInvestmentWithoutGST,
    ciInvestment,
    loanAmount,
    monthlyMortgage,
    monthlyPocketMoney,
    purchasePSF,
    marketPSF,
    suggestedLTV,
    scenarios: {
      conservative: conservativeResult,
      baseline: baselineResult,
      target: targetResult,
      aggressive: aggressiveResult,
    },
    investableDecision,
    investableScore,
  }
}

/**
 * Format currency value for display
 */
export function formatCurrency(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format number with commas
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-SG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
