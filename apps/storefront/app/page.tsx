export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">catalog.mx</h1>
      <p className="text-gray-500 mb-8">Digital catalogs for small businesses</p>
      <p className="text-sm text-gray-400">
        Visit{' '}
        <code className="bg-gray-100 px-2 py-1 rounded text-xs">/demo/heladeria-pinguino</code>
        {' '}to see a catalog demo
      </p>
      <div className="mt-4 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
        Next.js 15 + App Router + Tailwind ✅
      </div>
    </div>
  )
}
