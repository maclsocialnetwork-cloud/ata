type Props = {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: Props) {
  const pct = Math.min((current / total) * 100, 100)

  return (
    <div className="w-full px-4 pb-2">
      <p className="text-[11px] text-white/60 text-center mb-1.5 font-medium tracking-wide">
        Question {current} sur {total}
      </p>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-ata-orange rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
