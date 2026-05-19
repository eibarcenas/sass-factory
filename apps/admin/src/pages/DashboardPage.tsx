import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { useBusinesses } from '../hooks/useBusinesses'
import CreateDemoForm from '../components/demos/CreateDemoForm'
import DemoList from '../components/demos/DemoList'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

function Sidebar({ active, onNavigate }: { active: string; onNavigate: (p: string) => void }) {
  const { user, mockMode } = useAuthStore()
  const { data } = useBusinesses()

  const pipeline = [
    { label: 'Draft', status: 'draft' },
    { label: 'Demo', status: 'demo' },
    { label: 'Sent', status: 'sent' },
    { label: 'Accepted', status: 'accepted' },
    { label: 'Active', status: 'active' },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="font-bold text-gray-900 text-lg">catalog.mx</span>
        {mockMode && (
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">mock</span>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {['dashboard', 'demos'].map(page => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${
              active === page
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {page === 'dashboard' ? '🏠 Dashboard' : '✨ Demos'}
          </button>
        ))}

        {/* Pipeline counts */}
        <div className="pt-4 px-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pipeline</p>
          <div className="space-y-1.5">
            {pipeline.map(({ label, status }) => {
              const count = data?.businesses.filter(b => b.status === status).length ?? 0
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
      </div>
    </aside>
  )
}

export default function DashboardPage() {
  const [page, setPage] = useState('dashboard')
  const [showForm, setShowForm] = useState(false)
  const { data } = useBusinesses()

  const activeCount = data?.businesses.filter(b => b.status === 'active').length ?? 0
  const demoCount = data?.businesses.filter(b => ['demo', 'sent', 'accepted'].includes(b.status)).length ?? 0

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar active={page} onNavigate={setPage} />

      <main className="flex-1 overflow-y-auto p-8">
        {page === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Sales pipeline overview</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Active businesses', value: activeCount },
                { label: 'In pipeline', value: demoCount },
                { label: 'Total', value: data?.total ?? 0 },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Quick create demo</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {showForm ? 'Cancel' : '+ New demo'}
                </button>
              </div>
              {showForm ? (
                <CreateDemoForm
                  onSuccess={(slug) => {
                    setShowForm(false)
                    window.open(`${STOREFRONT_URL}/demo/${slug}`, '_blank')
                  }}
                />
              ) : (
                <p className="text-sm text-gray-400">
                  Create a demo for a prospect and share the link at{' '}
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/demo/&#123;slug&#125;</code>
                </p>
              )}
            </div>
          </div>
        )}

        {page === 'demos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Demos</h1>
                <p className="text-gray-500 text-sm mt-1">Sales pipeline</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {showForm ? 'Cancel' : '+ New demo'}
              </button>
            </div>

            {showForm && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Create demo</h2>
                <CreateDemoForm
                  onSuccess={(slug) => {
                    setShowForm(false)
                    window.open(`${STOREFRONT_URL}/demo/${slug}`, '_blank')
                  }}
                />
              </div>
            )}

            <DemoList />
          </div>
        )}
      </main>
    </div>
  )
}
