import type { BusinessStatus } from '@catalog-mx/core'

const CONFIG: Record<BusinessStatus, { label: string; classes: string }> = {
  draft:    { label: 'Draft',    classes: 'bg-slate-100 text-slate-600' },
  demo:     { label: 'Demo',     classes: 'bg-blue-100 text-blue-700' },
  sent:     { label: 'Sent',     classes: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Accepted', classes: 'bg-green-100 text-green-700' },
  active:   { label: 'Active',   classes: 'bg-emerald-100 text-emerald-700' },
  suspended:{ label: 'Suspended',classes: 'bg-red-100 text-red-700' },
  expired:  { label: 'Expired', classes: 'bg-gray-100 text-gray-500' },
  rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-600' },
  archived: { label: 'Archived', classes: 'bg-gray-50 text-gray-400' },
}

export default function StatusBadge({ status }: { status: BusinessStatus }) {
  const { label, classes } = CONFIG[status] ?? CONFIG.draft
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}
