'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { ParameterInput } from '@/components/parameter-input'
import { calculateGrowth, formatCurrency } from '@/lib/calculations'
import { cn } from '@/lib/utils'

const COMPOUND_OPTIONS = [
  { value: 1, label: 'Annually' },
  { value: 2, label: 'Semi-annual' },
  { value: 4, label: 'Quarterly' },
  { value: 12, label: 'Monthly' },
  { value: 365, label: 'Daily' },
] as const

const chartConfig = {
  contributions: { label: 'Contributions', color: 'var(--chart-1)' },
  growth: { label: 'Growth', color: 'var(--chart-2)' },
} as const

export function CompoundInterestCalculator() {
  const [initial, setInitial] = useState(10000)
  const [monthly, setMonthly] = useState(500)
  const [rate, setRate] = useState(7)
  const [years, setYears] = useState(30)
  const [compounding, setCompounding] = useState(12)

  const data = useMemo(
    () => calculateGrowth({ initial, monthly, rate, years, compounding }),
    [initial, monthly, rate, years, compounding]
  )

  const final = data[data.length - 1]
  const totalContributions = final?.contributions ?? initial
  const totalGrowth = final?.growth ?? 0
  const finalBalance = final?.total ?? initial
  const growthRatio = totalContributions > 0 ? (totalGrowth / totalContributions) * 100 : 0

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      {/* Inputs */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your plan
        </h2>
        <div className="mt-6 space-y-6">
          <ParameterInput
            label="Initial amount"
            prefix="$"
            value={initial}
            min={0}
            max={1000000}
            step={500}
            onChange={setInitial}
          />
          <ParameterInput
            label="Monthly contribution"
            prefix="$"
            value={monthly}
            min={0}
            max={10000}
            step={50}
            onChange={setMonthly}
          />
          <ParameterInput
            label="Annual interest rate"
            suffix="%"
            value={rate}
            min={0}
            max={20}
            step={0.25}
            onChange={setRate}
          />
          <ParameterInput
            label="Time period"
            suffix="yrs"
            value={years}
            min={1}
            max={50}
            step={1}
            onChange={setYears}
          />
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium text-foreground">Compounding</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {COMPOUND_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCompounding(option.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  compounding === option.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-ring hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <TrendingUp className="size-4" />
            Projected balance
          </div>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
            {formatCurrency(finalBalance)}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
            <Stat
              label="Contributed"
              value={formatCurrency(totalContributions)}
            />
            <Stat
              label="Growth earned"
              value={formatCurrency(totalGrowth)}
              accent
            />
            <Stat
              label="Growth vs. saved"
              value={`${growthRatio.toFixed(0)}%`}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-foreground">
              Growth over time
            </h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <LegendDot color="var(--chart-1)" label="Contributions" />
              <LegendDot color="var(--chart-2)" label="Growth" />
            </div>
          </div>
          <div className="mt-4">
            <ChartContainer config={chartConfig} className="h-[340px] w-full">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 8, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-growth)"
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-growth)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${value} yr`}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(value) => formatCurrency(value, true)}
                />
                <ChartTooltip
                  cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Area
                  dataKey="contributions"
                  stackId="1"
                  type="monotone"
                  stroke="var(--color-contributions)"
                  fill="var(--color-contributions)"
                  fillOpacity={0.55}
                />
                <Area
                  dataKey="growth"
                  stackId="1"
                  type="monotone"
                  stroke="var(--color-growth)"
                  fill="url(#fillGrowth)"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 font-mono text-sm font-semibold tabular-nums sm:text-base',
          accent ? 'text-primary' : 'text-foreground'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="size-2.5 rounded-[3px]"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
