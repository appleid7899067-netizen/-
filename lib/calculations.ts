export interface YearPoint {
  year: number
  contributions: number
  growth: number
  total: number
}

export interface CalculationInput {
  initial: number
  monthly: number
  rate: number // annual rate in percent
  years: number
  compounding: number // compounding periods per year
}

/**
 * Simulates investment growth month-by-month and returns a point for each
 * year boundary. Contributions are added at the end of each month (ordinary
 * annuity), and interest is applied using the effective monthly rate derived
 * from the chosen annual compounding frequency.
 */
export function calculateGrowth(input: CalculationInput): YearPoint[] {
  const { initial, monthly, rate, years, compounding } = input
  const annualRate = rate / 100
  const effectiveAnnual = Math.pow(1 + annualRate / compounding, compounding) - 1
  const monthlyRate = Math.pow(1 + effectiveAnnual, 1 / 12) - 1

  const points: YearPoint[] = []
  let balance = initial
  let totalContributions = initial
  const totalMonths = Math.max(1, Math.round(years * 12))

  for (let m = 1; m <= totalMonths; m++) {
    balance = balance * (1 + monthlyRate) + monthly
    totalContributions += monthly
    if (m % 12 === 0 || m === totalMonths) {
      points.push({
        year: m / 12,
        contributions: totalContributions,
        growth: balance - totalContributions,
        total: balance,
      })
    }
  }
  return points
}

export function formatCurrency(value: number, compact = false): string {
  const abs = Math.abs(value)
  if (compact) {
    if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
    if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`
    return `$${Math.round(value).toLocaleString()}`
  }
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}
