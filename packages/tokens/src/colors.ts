export const colors = {
  primary: {
    50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
    400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
    800: '#166534', 900: '#14532d',
  },
  neutral: {
    0: '#ffffff', 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
    300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569',
    700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617',
  },
  success: { 50: '#f0fdf4', 500: '#22c55e', 700: '#15803d' },
  warning: { 50: '#fffbeb', 500: '#f59e0b', 700: '#b45309' },
  error:   { 50: '#fef2f2', 500: '#ef4444', 700: '#b91c1c' },
  info:    { 50: '#eff6ff', 500: '#3b82f6', 700: '#1d4ed8' },
  // Business status colors
  status: {
    draft:    { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
    demo:     { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    sent:     { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    accepted: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    active:   { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
    suspended:{ bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
    expired:  { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
    rejected: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
    archived: { bg: '#f8fafc', text: '#94a3b8', border: '#e2e8f0' },
  },
} as const

export type ColorScale = typeof colors
