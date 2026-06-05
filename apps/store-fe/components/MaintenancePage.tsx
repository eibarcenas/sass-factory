interface Props {
  name?: string
}

export default function MaintenancePage({ name }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#FAF9F6' }}
    >
      <div className="text-center max-w-xs space-y-5">
        {/* Tool icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-zinc-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        {name && (
          <h1 className="text-xl font-semibold text-zinc-900 leading-tight">{name}</h1>
        )}

        <div className="space-y-1">
          <p className="text-zinc-600 font-medium">Estamos preparando algo increíble.</p>
          <p className="text-zinc-400 text-sm">Vuelve pronto.</p>
        </div>

        <a
          href="https://catalog.mx"
          className="inline-block text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          catalog.mx
        </a>
      </div>
    </div>
  )
}
