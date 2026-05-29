import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
  onSettings?: () => void
  settingsActive?: boolean
  headerSlot?: React.ReactNode
  footerSlot?: React.ReactNode
  children?: React.ReactNode
}

export default function AppSidebar<T extends string>({
  nav,
  active,
  onNavigate,
  onSettings,
  settingsActive = false,
  headerSlot,
  footerSlot,
  children,
}: AppSidebarProps<T>) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`${collapsed ? 'w-14' : 'w-48'} bg-background border-r flex flex-col h-screen sticky top-0 transition-all duration-200`}
    >
      <div className="px-3 py-4 border-b flex items-center justify-between gap-2">
        {!collapsed && <span className="font-bold text-lg truncate">catalog.mx</span>}
        {!collapsed && headerSlot}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {nav.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            title={collapsed ? item.label : undefined}
            className={`w-full text-left flex items-center justify-between px-2.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active === item.key && !settingsActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </span>
            {!collapsed && (item.badge ?? 0) > 0 && (
              <Badge className="bg-green-500 text-white text-xs h-5">{item.badge}</Badge>
            )}
          </button>
        ))}
        {children}
      </nav>

      {onSettings && (
        <>
          <Separator />
          <div className="px-2 py-3">
            <button
              onClick={onSettings}
              title={collapsed ? 'Settings' : undefined}
              className={`w-full text-left flex items-center gap-2 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                settingsActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="shrink-0">⚙</span>
              {!collapsed && <span className="truncate">Settings</span>}
            </button>
          </div>
        </>
      )}

      <div className={`px-3 py-4 border-t ${collapsed ? 'hidden' : ''}`}>
        {footerSlot}
      </div>
    </aside>
  )
}
