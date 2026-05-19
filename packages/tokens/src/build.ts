import { writeFileSync, mkdirSync } from 'node:fs'
import { generateCssVars } from './css-vars'

mkdirSync('dist', { recursive: true })
writeFileSync('dist/tokens.css', generateCssVars())
console.log('✅ dist/tokens.css generated')
