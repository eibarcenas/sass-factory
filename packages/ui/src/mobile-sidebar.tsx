import * as React from 'react'
import { cn } from './utils'

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function MobileSidebar({ open, onClose, children }: MobileSidebarProps) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[220px] bg-background border-r border-border shadow-xl',
          'transform transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {children}
      </div>
    </>
  )
}
