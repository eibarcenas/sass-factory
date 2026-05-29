import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  role?: string
  onSettings?: () => void
}

export function SidebarProfile({ email, displayName, photoURL, role, onSettings }: SidebarProfileProps) {
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
      <div className="flex-1 min-w-0">
        <span className="text-sm text-foreground block truncate leading-tight">{label}</span>
        {role && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">
            {role}
          </span>
        )}
      </div>
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
  icon: React.ReactNode
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

export default function AppSidebar<T extends string>({
  nav,
  active,
  onNavigate,
  headerSlot,
  footerSlot,
  children,
}: AppSidebarProps<T>) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`${collapsed ? 'w-14' : 'w-[220px]'} bg-background border-r border-border flex flex-col h-screen sticky top-0 transition-all duration-200 shadow-sm`}
    >
      {/* Header */}
      <div className="px-3 py-4 border-b border-border flex items-center justify-between gap-2 min-h-[57px]">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-base text-primary truncate">catalog.mx</span>
            {headerSlot}
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            title={collapsed ? item.label : undefined}
            className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === item.key
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className={`shrink-0 flex items-center ${active === item.key ? 'text-primary' : ''}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </span>
            {!collapsed && (item.badge ?? 0) > 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5 min-w-4 flex items-center justify-center">
                {item.badge}
              </Badge>
            )}
          </button>
        ))}
        {children}
      </nav>

      {/* Footer */}
      <div className={`px-3 py-3 border-t border-border ${collapsed ? 'hidden' : ''}`}>
        {footerSlot}
      </div>
    </aside>
  )
}
