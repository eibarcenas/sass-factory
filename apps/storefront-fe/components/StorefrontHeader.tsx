import type { Business } from '@eguru/core'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function StorefrontHeader({
  business,
  cartCount,
  onOpenCart,
}: {
  business: Business
  cartCount: number
  onOpenCart: () => void
}) {
  return (
    <header className="sticky top-0 z-10 bg-background border-b shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: business.theme.primary + '20' }}
          >
            {business.theme.emoji}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm leading-tight truncate">{business.name}</h1>
            <p className="text-xs text-muted-foreground truncate">{business.city}</p>
          </div>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="relative h-9 w-9 rounded-full"
          onClick={onOpenCart}
          aria-label={`Abrir carrito con ${cartCount} productos`}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
              {cartCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}
