'use client'

interface GaugeProps {
  value: number
  max: number
  levels: { label: string; value: number; color: string }[]
  size?: number
  label?: string
  formatValue?: (v: number) => string
}

export default function Gauge({ value, max, levels, size = 260, label, formatValue }: GaugeProps) {
  const isLarge = size > 200
  const strokeW = isLarge ? 28 : 18
  const r = (size - strokeW - 24) / 2
  const cx = size / 2
  const cy = size / 2 + 15
  const startAngle = -210
  const endAngle = 30
  const totalArc = endAngle - startAngle

  const toRad = (deg: number) => (deg * Math.PI) / 180
  const polar = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  })

  const arc = (s: number, e: number, radius: number) => {
    const sp = polar(s, radius)
    const ep = polar(e, radius)
    return `M ${sp.x} ${sp.y} A ${radius} ${radius} 0 ${e - s > 180 ? 1 : 0} 1 ${ep.x} ${ep.y}`
  }

  const currentLevel = [...levels].reverse().find((l) => value >= l.value) || levels[0]
  const nextLevel = levels.find((l) => l.value > value)
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const needleAngle = startAngle + pct * totalArc

  const needleTip = polar(needleAngle, r - 8)
  const nb1 = polar(needleAngle + 90, 6)
  const nb2 = polar(needleAngle - 90, 6)

  const display = formatValue ? formatValue(value) : String(value)
  const faltam = nextLevel ? (formatValue ? formatValue(nextLevel.value - value) : String(Math.round(nextLevel.value - value))) : null
  const activeColor = currentLevel?.color || '#A3E635'

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        <defs>
          <filter id={`glow-${size}`}>
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`glow-strong-${size}`}>
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <path d={arc(startAngle, endAngle, r)} fill="none" stroke="#111111" strokeWidth={strokeW} strokeLinecap="round" />

        {/* Level segments */}
        {levels.map((level, i) => {
          const nextVal = i < levels.length - 1 ? levels[i + 1].value : max
          const segStart = startAngle + (level.value / max) * totalArc
          const segEnd = startAngle + (nextVal / max) * totalArc
          return <path key={level.label} d={arc(segStart, Math.min(segEnd, endAngle), r)} fill="none" stroke={level.color} strokeWidth={strokeW} strokeLinecap="round" opacity={0.12} />
        })}

        {/* Filled arc — lime green always (ZAPE identity) */}
        {pct > 0 && (
          <>
            <path d={arc(startAngle, needleAngle, r)} fill="none" stroke="#A3E635" strokeWidth={strokeW} strokeLinecap="round" opacity={0.3} filter={`url(#glow-strong-${size})`} />
            <path d={arc(startAngle, needleAngle, r)} fill="none" stroke="#A3E635" strokeWidth={strokeW} strokeLinecap="round" />
          </>
        )}

        {/* Level tick marks with labels */}
        {levels.map((level) => {
          const angle = startAngle + (level.value / max) * totalArc
          const outer = polar(angle, r + strokeW / 2 + 8)
          const inner = polar(angle, r + strokeW / 2 + 2)
          return (
            <g key={level.label}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={level.color} strokeWidth={2.5} opacity={0.6} />
            </g>
          )
        })}

        {/* Needle */}
        <polygon points={`${needleTip.x},${needleTip.y} ${nb1.x},${nb1.y} ${nb2.x},${nb2.y}`} fill="#A3E635" filter={`url(#glow-${size})`} />
        <circle cx={cx} cy={cy} r={7} fill="#0a0a0a" stroke="#A3E635" strokeWidth={2} />
      </svg>

      {/* Value display */}
      <div className="text-center -mt-1">
        <p className={`font-black text-lime-400 tracking-tight leading-none ${isLarge ? 'text-5xl' : 'text-3xl'}`}>{display}</p>
        {label && <p className={`font-bold uppercase tracking-[0.12em] text-zinc-500 ${isLarge ? 'text-[12px] mt-3' : 'text-[10px] mt-2'}`}>{label}</p>}

        {/* Current level + next target */}
        <div className="flex flex-col items-center gap-2 mt-4">
          <span
            className={`px-5 py-2 rounded-xl font-black uppercase tracking-[0.08em] ${isLarge ? 'text-[14px]' : 'text-[12px]'}`}
            style={{ background: activeColor + '20', color: activeColor, border: `2px solid ${activeColor}40`, boxShadow: `0 0 20px ${activeColor}15` }}
          >
            {currentLevel?.label || '—'}
          </span>
          {faltam && nextLevel && (
            <div className="flex flex-col items-center gap-0.5">
              <span className={`font-black text-lime-400 ${isLarge ? 'text-[18px]' : 'text-[14px]'}`}>
                {faltam}
              </span>
              <span className={`font-bold uppercase tracking-[0.1em] text-zinc-600 ${isLarge ? 'text-[11px]' : 'text-[9px]'}`}>
                para atingir {nextLevel.label}
              </span>
            </div>
          )}
          {!nextLevel && value > 0 && (
            <span className={`font-black text-lime-400 uppercase tracking-[0.1em] ${isLarge ? 'text-[14px]' : 'text-[11px]'}`}>
              Meta Atingida!
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
