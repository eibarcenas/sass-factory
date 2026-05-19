import { useAuthStore } from '../store/auth'

export default function DashboardPage() {
  const { user, mockMode } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="font-bold text-gray-900 text-lg">catalog.mx</span>
          {mockMode && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
              mock
            </span>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {['Dashboard', 'Demos', 'Businesses', 'Prospects', 'Analytics'].map((item) => (
            <button
              key={item}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-500 text-sm mb-8">
          React + Vite + TanStack Query + Zustand + Tailwind ✅
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total businesses', value: '0' },
            { label: 'Demos in pipeline', value: '0' },
            { label: 'MRR', value: '$0' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create your first demo</h2>
          <p className="text-sm text-gray-500">
            Generate a catalog demo for a prospect and share it at{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              /demo/&#123;slug&#125;
            </code>
          </p>
          <button className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
            + New demo
          </button>
        </div>
      </main>
    </div>
  )
}
