import { BusinessStatus } from '@eguru/core'

const CONFIG: Record<BusinessStatus, { label: string; classes: string }> = {
  [BusinessStatus.Draft]:         { label: 'Borrador',  classes: 'bg-gray-100 text-gray-600'      },
  [BusinessStatus.PendingReview]: { label: 'En revisión', classes: 'bg-blue-100 text-blue-700'    },
  [BusinessStatus.Pending]:       { label: 'Pendiente', classes: 'bg-amber-100 text-amber-700'    },
  [BusinessStatus.Active]:        { label: 'Activa',    classes: 'bg-emerald-100 text-emerald-700' },
  [BusinessStatus.Inactive]:      { label: 'Inactiva',  classes: 'bg-slate-100 text-slate-500'    },
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
