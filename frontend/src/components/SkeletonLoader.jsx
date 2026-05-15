export default function SkeletonLoader({ rows = 3, card = false }) {
  if (card) {
    return (
      <div className="surface-card animate-pulse">
        <div className="skeleton h-5 w-2/3 mb-3" />
        <div className="skeleton h-3 w-full mb-2" />
        <div className="skeleton h-3 w-5/6" />
      </div>
    )
  }
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`skeleton h-4 ${i % 2 === 0 ? 'w-full' : 'w-4/5'}`} />
      ))}
    </div>
  )
}
