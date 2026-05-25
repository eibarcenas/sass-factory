import { Badge } from '@/components/ui/badge'

export interface NavItem<T extends string = string> {
  key: T
  icon: string
  label: string
  badge?: number
}

interface AppSidebarProps<T extends string = string> {
  nav: NavItem<T>[]
  active: T
  onNavigate: (key: T) => void
  headerSlot?: React.ReactNode
  footerSlot?: React.ReactNode
  children?: React.ReactNode
}

export default function AppSidebar<T extends string>({ nav, active, onNavigate, headerSlot, footerSlot, children }: AppSidebarProps<T>) {
  return (
    <aside className="w-64 bg-background border-r flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b">
        <span className="font-bold text-lg">catalog.mx</span>
        {headerSlot}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active === item.key
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{item.icon}</span> {item.label}
            </span>
            {(item.badge ?? 0) > 0 && (
              <Badge className="bg-green-500 text-white text-xs h-5">{item.badge}</Badge>
            )}
          </button>
        ))}
        {children}
      </nav>
      <div className="px-4 py-4 border-t">
        {footerSlot}
      </div>
    </aside>
  )
}
