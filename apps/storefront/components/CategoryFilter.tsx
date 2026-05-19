'use client'

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: string[]
  selected: string
  onSelect: (cat: string) => void
}) {
  if (!categories.length) return null
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selected === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        onClick={() => onSelect('')}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selected === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
