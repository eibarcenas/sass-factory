import { BusinessStatus } from '@eguru/core'

const CONFIG: Record<BusinessStatus, { label: string; classes: string }> = {
  [BusinessStatus.Pending]:  { label: 'Pendiente', classes: 'bg-amber-100 text-amber-700'   },
  [BusinessStatus.Active]:   { label: 'Activa',    classes: 'bg-emerald-100 text-emerald-700' },
  [BusinessStatus.Inactive]: { label: 'Inactiva',  classes: 'bg-slate-100 text-slate-500'   },
}

export default function StatusBadge({ status }: { status: BusinessStatus }) {
  const { label, classes } = CONFIG[status] ?? CONFIG[BusinessStatus.Inactive]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}
