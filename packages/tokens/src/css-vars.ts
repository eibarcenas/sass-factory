import { colors } from './colors'
import { spacing } from './spacing'
import { borders } from './borders'
import { shadows } from './shadows'
import { zIndex } from './z-index'

function flatten(obj: Record<string, any>, prefix = ''): Record<string, string> {
  return Object.entries(obj).reduce<Record<string, string>>((acc, [key, val]) => {
    const name = prefix ? `${prefix}-${key}` : key
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(acc, flatten(val, name))
    } else {
      acc[name] = String(val)
    }
    return acc
  }, {})
}

export function generateCssVars(): string {
  const vars: Record<string, string> = {
    ...flatten(colors, 'color'),
    ...flatten(spacing, 'space'),
    ...flatten(borders.radius, 'radius'),
    ...flatten(borders.width, 'border'),
    ...flatten(shadows, 'shadow'),
    ...flatten(zIndex, 'z'),
  }

  const declarations = Object.entries(vars)
    .map(([k, v]) => `  --sf-${k}: ${v};`)
    .join('\n')

  return `:root {\n${declarations}\n}\n`
}
