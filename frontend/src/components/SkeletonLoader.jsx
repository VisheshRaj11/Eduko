export default function SkeletonLoader({ card, rows = 1 }) {
  if (card) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm w-full animate-pulse flex flex-col gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className="w-full animate-pulse flex flex-col gap-4">
      {[...Array(rows)].map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-gray-200 rounded w-full"
          style={{ width: i % 2 === 0 ? '100%' : '80%' }}
        ></div>
      ))}
    </div>
  )
}