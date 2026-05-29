import { Badge } from '@/components/ui/badge'

function getInitials(email: string | null): string {
  if (!email) return '?'
  const parts = email.split('@')[0].split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export interface SidebarProfileProps {
  email: string | null
  displayName?: string | null
  photoURL?: string | null
  onSettings?: () => void
}

export function SidebarProfile({ email, displayName, photoURL, onSettings }: SidebarProfileProps) {
  const initials = getInitials(email)
  const label = displayName ?? (email ? email.split('@')[0] : '')

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden">
        {photoURL
          ? <img src={photoURL} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          : initials
        }
      </div>
      <span className="text-sm text-foreground flex-1 truncate">{label}</span>
      {onSettings && (
        <button
          onClick={onSettings}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          aria-label="Settings"
        >
          ⚙
        </button>
      )}
    </div>
  )
}

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
