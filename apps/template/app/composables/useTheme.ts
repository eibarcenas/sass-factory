import type { AppTheme } from '@sass-factory/core'

export function useTheme() {
  function applyTheme(theme: Partial<AppTheme>) {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    if (theme.primary) root.style.setProperty('--color-primary', theme.primary)
    if (theme.secondary) root.style.setProperty('--color-secondary', theme.secondary)
    if (theme.accent) root.style.setProperty('--color-accent', theme.accent)
    if (theme.background) root.style.setProperty('--color-background', theme.background)

    if (theme.gradient?.length) {
      root.style.setProperty('--gradient-start', theme.gradient[0])
      root.style.setProperty('--gradient-end', theme.gradient[theme.gradient.length - 1])
    }

    if (theme.font) {
      // Load Google Font dynamically
      const fontName = encodeURIComponent(theme.font)
      const existingLink = document.querySelector(`link[data-font="${fontName}"]`)
      if (!existingLink) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`
        link.setAttribute('data-font', fontName)
        document.head.appendChild(link)
      }
      root.style.setProperty('--font-heading', `"${theme.font}", serif`)
    }
  }

  function clearTheme() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.style.removeProperty('--color-primary')
    root.style.removeProperty('--color-secondary')
    root.style.removeProperty('--color-accent')
    root.style.removeProperty('--color-background')
    root.style.removeProperty('--gradient-start')
    root.style.removeProperty('--gradient-end')
    root.style.removeProperty('--font-heading')
  }

  return { applyTheme, clearTheme }
}
