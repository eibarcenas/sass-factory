import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusinesses, useBusinessAction } from '../../hooks/useBusinesses'
import StatusBadge from '../ui/StatusBadge'
import CreateOwnerModal from './CreateOwnerModal'
import { BusinessStatus, type Business } from '@eguru/core'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

const STATUS_FILTERS: { label: string; value: BusinessStatus | '' }[] = [
  { label: 'All',      value: '' },
  { label: 'Draft',    value: BusinessStatus.Draft },
  { label: 'Demo',     value: BusinessStatus.Demo },
  { label: 'Sent',     value: BusinessStatus.Sent },
  { label: 'Accepted', value: BusinessStatus.Accepted },
  { label: 'Active',   value: BusinessStatus.Active },
]

const ACTIONS: Partial<Record<BusinessStatus, { label: string; classes: string }>> = {
  [BusinessStatus.Draft]:     { label: 'Publish demo',  classes: 'bg-blue-600 hover:bg-blue-700' },
  [BusinessStatus.Demo]:      { label: 'Mark as sent',  classes: 'bg-yellow-600 hover:bg-yellow-700' },
  [BusinessStatus.Sent]:      { label: 'Mark accepted', classes: 'bg-green-600 hover:bg-green-700' },
  [BusinessStatus.Accepted]:  { label: 'Activate',      classes: 'bg-emerald-600 hover:bg-emerald-700' },
  [BusinessStatus.Active]:    { label: 'Suspend',       classes: 'bg-red-600 hover:bg-red-700' },
  [BusinessStatus.Suspended]: { label: 'Reactivate',    classes: 'bg-green-600 hover:bg-green-700' },
}

const ACTION_MAP: Partial<Record<BusinessStatus, string>> = {
  [BusinessStatus.Draft]:     'publish',
  [BusinessStatus.Demo]:      'send',
  [BusinessStatus.Sent]:      'accept',
  [BusinessStatus.Accepted]:  'activate',
  [BusinessStatus.Active]:    'suspend',
  [BusinessStatus.Suspended]: 'activate',
}

function DemoCard({ business, onSelect }: { business: Business; onSelect?: (b: Business) => void }) {
  const action = useBusinessAction()
  const navigate = useNavigate()
  const [showOwnerModal, setShowOwnerModal] = useState(false)
  const btn = ACTIONS[business.status]
  const verb = ACTION_MAP[business.status]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <button
            className="flex items-center gap-3 min-w-0 text-left flex-1"
            onClick={() => onSelect?.(business)}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: (business.theme?.primary ?? '#6366f1') + '20' }}
            >
              {business.theme?.emoji ?? '🏪'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{business.name}</p>
              <p className="text-xs text-gray-500">{business.type} · {business.city}</p>
            </div>
          </button>
          <StatusBadge status={business.status} />
        </div>

        {business.tagline && (
          <p className="mt-2 text-xs text-gray-400 line-clamp-1">{business.tagline}</p>
        )}

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <a
            href={`${STOREFRONT_URL}/demo/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline"
          >
            View demo →
          </a>
          <button
            onClick={() => navigate(`/owner/preview/${business.slug}`)}
            className="text-xs font-medium text-gray-700 border border-gray-300 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Preview panel
          </button>
          <button
            onClick={() => setShowOwnerModal(true)}
            className="text-xs font-medium text-indigo-700 border border-indigo-300 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Activate owner
          </button>
          {btn && verb && (
            <button
              disabled={action.isPending}
              onClick={() => action.mutate({ id: business.id, action: verb })}
              className={`ml-auto text-xs font-medium text-white px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${btn.classes}`}
            >
              {btn.label}
            </button>
          )}
        </div>
      </div>

      {showOwnerModal && (
        <CreateOwnerModal
          businessId={business.id}
          businessName={business.name}
          onClose={() => setShowOwnerModal(false)}
        />
      )}
    </div>
  )
}

export default function DemoList({ onSelectBusiness }: { onSelectBusiness?: (b: Business) => void }) {
  const [filter, setFilter] = useState<BusinessStatus | ''>('')
  const { data, isLoading } = useBusinesses(filter || undefined)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === f.value
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : data?.businesses.length ? (
        <div className="space-y-3">
          {data.businesses.map(b => <DemoCard key={b.id} business={b} onSelect={onSelectBusiness} />)}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">No demos yet — create your first one</p>
        </div>
      )}
    </div>
  )
}
