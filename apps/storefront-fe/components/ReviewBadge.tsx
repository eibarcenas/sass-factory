export default function ReviewBadge() {
  return (
    <div className="fixed top-0 inset-x-0 z-40 flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 py-2 px-4 text-xs font-medium text-amber-800">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM7.25 7.5a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3z" />
      </svg>
      Vista previa — catálogo en revisión. No es público todavía.
    </div>
  )
}
