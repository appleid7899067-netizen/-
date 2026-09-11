'use client'

import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface ParameterInputProps {
  label: string
  prefix?: string
  suffix?: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  displayValue?: string
}

export function ParameterInput({
  label,
  prefix,
  suffix,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}: ParameterInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="flex items-center gap-1.5">
          {prefix && (
            <span className="text-sm text-muted-foreground">{prefix}</span>
          )}
          <input
            type="number"
            value={displayValue ?? value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const parsed = Number(e.target.value)
              if (!Number.isNaN(parsed)) onChange(parsed)
            }}
            className="w-24 rounded-md border border-input bg-background px-2 py-1 text-right font-mono text-sm tabular-nums outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            aria-label={label}
          />
          {suffix && (
            <span className="text-sm text-muted-foreground">{suffix}</span>
          )}
        </div>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(typeof v === 'number' ? v : v[0])}
        aria-label={label}
      />
    </div>
  )
}
