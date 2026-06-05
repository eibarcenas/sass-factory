'use client'

import { Button } from '@/components/ui/button'

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
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <Button
        size="sm"
        variant={selected === '' ? 'default' : 'secondary'}
        className="rounded-full shrink-0"
        onClick={() => onSelect('')}
      >
        All
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat}
          size="sm"
          variant={selected === cat ? 'default' : 'secondary'}
          className="rounded-full shrink-0"
          onClick={() => onSelect(cat)}
        >
          {cat}
        </Button>
      ))}
    </div>
  )
}
