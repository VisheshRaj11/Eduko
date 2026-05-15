export default function ProgressBar({ value = 0, max = 100, label, showPercent = true, color = 'green' }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  const colors = {
    green: 'linear-gradient(90deg, #16a34a, #4ade80)',
    blue:  'linear-gradient(90deg, #2563eb, #60a5fa)',
    warm:  'linear-gradient(90deg, #f59e0b, #fbbf24)',
  }
  return (
    <div>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
          {showPercent && <span className="text-sm font-bold text-slate-600">{pct}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: colors[color] || colors.green }}
        />
      </div>
    </div>
  )
}
