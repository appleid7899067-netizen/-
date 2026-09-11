import { CompoundInterestCalculator } from '@/components/compound-interest-calculator'

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Compound interest calculator
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Watch your money grow, year after year
        </h1>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          Adjust your starting balance, monthly contributions, rate, and time
          horizon to see how compounding turns steady saving into meaningful
          growth. The chart separates what you put in from what your money
          earns.
        </p>
      </header>

      <CompoundInterestCalculator />

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        Estimates assume contributions are made at the end of each month and
        interest compounds at the selected frequency. Results are projections,
        not financial advice — actual returns vary with market conditions.
      </p>
    </main>
  )
}
