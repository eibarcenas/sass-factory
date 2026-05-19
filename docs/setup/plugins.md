# Plugins — Instalación y uso por sprint

## Prerrequisitos

Antes de instalar, necesitas tener listos:

```
CONTEXT7_API_KEY    → https://context7.com/dashboard  (gratis)
GITHUB_PAT          → https://github.com/settings/tokens
                      Permisos: repo, read:org, read:user
ANTHROPIC_API_KEY   → ya configurado en el proyecto
```

---

## Paso 1 — Plugins del sistema Claude (Skills)

Ejecuta estos comandos dentro de Claude Code (en la sesión del proyecto):

```
/plugin install context7@claude-plugins-official
/plugin install github@claude-plugins-official
/plugin install playwright@claude-plugins-official
/plugin install frontend-design@claude-plugins-official
/plugin install feature-dev@claude-plugins-official
/plugin install security-guidance@claude-plugins-official
/plugin install code-review@claude-plugins-official
```

---

## Paso 2 — MCP Servers via CLI

Ejecuta en terminal, en la raíz del proyecto:

### Context7 (docs live de Nuxt 4, Vue 3, UnoCSS, Vite)

```bash
claude mcp add --scope project context7 -- npx -y @upstash/context7-mcp --api-key TU_CONTEXT7_API_KEY
```

### GitHub MCP (gestión de ramas, PRs, issues desde agentes)

```bash
claude mcp add-json github '{
  "type": "http",
  "url": "https://api.githubcopilot.com/mcp",
  "headers": {
    "Authorization": "Bearer TU_GITHUB_PAT"
  }
}'
```

### Playwright MCP (E2E tests desde agentes)

```bash
claude mcp add --scope project playwright npx @playwright/mcp@latest
```

---

## Paso 3 — Verificar que quedaron instalados

```bash
claude mcp list
```

Debes ver:
```
context7    ✓ connected
github      ✓ connected
playwright  ✓ connected
```

Para los plugins de sistema (skills), verifica con:
```
/help
```
Deben aparecer en la lista de comandos disponibles.

---

## Referencia rápida — Prompt por plugin y por sprint

### Context7 — Úsalo desde Sprint 0 en adelante

```
use context7 to show me how to configure Module Federation in Vite 5 with Nuxt 4
use context7 to show me Nuxt 4 server middleware with H3
use context7 to show me UnoCSS theme configuration with CSS custom properties
use context7 to show me Firebase Auth with Vue 3 composables
use context7 to show me @module-federation/vite setup for a host app
```

### GitHub — Úsalo desde Sprint 0 en adelante

```
Create a branch feature/sprint-0-cleanup from develop
Create a PR from feature/sprint-0-cleanup to develop with title "chore: Sprint 0 — cleanup wrong stack docs and rewrite core types"
Set branch protection rules on develop: require 1 review, require status checks typecheck and lint
List open PRs in this repository
```

### Playwright — Úsalo desde Sprint 3 (Storefront)

```
Use playwright to open http://localhost:3000/demo/heladeria-pinguino and take a screenshot
Use playwright to test that clicking "Pedir" opens the product modal
Use playwright to verify the WhatsApp button URL contains the correct phone number
Run the Playwright test suite in headless mode and report failures
```

### Frontend Design — Úsalo en Sprint 2 (Design System) y Sprint 3-5 (UI)

```
/frontend-design Build a product card component for a catalog SaaS. Mobile-first, Vue 3 Composition API, UnoCSS. Show product image, name, price in MXN, and a "Pedir por WhatsApp" CTA button. Avoid generic AI aesthetics — use bold typography and strong color contrast.

/frontend-design Create a StatusBadge component in Vue 3 + UnoCSS for business statuses: draft (gray), demo (blue), sent (yellow), accepted (green), active (emerald), suspended (red). Each badge shows an icon + label.

/frontend-design Design the storefront hero section for a small business catalog. Mobile viewport 390px. Business name, tagline, logo, and category filter pills. SSG-compatible (no client-only state).
```

### Feature Dev — Úsalo al inicio de cada sprint

```
/feature-dev Implement the business status machine for the catalog SaaS. Status: draft → demo → sent → accepted → active → suspended. Define TypeScript types in packages/core/src/types/business.ts, write unit tests first (TDD), then implement the transition validator.

/feature-dev Add auth middleware to Nitro/H3 that verifies Firebase JWT on all /api/v1/admin/* routes. Return 401 if no token, 403 if role insufficient. Write the failing test first, then implement.

/feature-dev Build the AI demo generator endpoint that repurposes the existing generate.post.ts (Claude + SSE) to generate business catalog demos instead of event landing pages. New system prompt for catalogs, same streaming infrastructure.
```

### Security Guidance — Úsalo en Sprint 1 y en cada PR crítico

```
/security-scan Review the Nitro auth middleware in apps/admin/server/middleware/auth.ts for JWT verification vulnerabilities
/audit Check the image upload endpoint for MIME type bypass, path traversal, and file size bypass vulnerabilities
/secrets-check Scan the entire repository for hardcoded API keys, tokens, or credentials
/dependency-audit Run OWASP dependency check on all packages in this pnpm monorepo
```

### Code Review — Úsalo antes de cada merge

```
/code-review Review the PR that adds the business status machine — check for missing status transition validations, edge cases in the state machine, and TypeScript strictness
/review apps/admin/server/api/businesses/index.post.ts — check for missing input validation, SQL/NoSQL injection, and auth bypass
/review-file packages/core/src/types/business.ts — verify the TypeScript types are strict, no implicit any, discriminated unions where needed
```

---

## Mapa Plugin → Sprint

| Sprint | Plugins activos |
|--------|----------------|
| 0 — Cleanup + SDD | Context7, GitHub |
| 1 — Fundación | Context7, GitHub, Feature Dev, Security Guidance |
| 2 — Design System | Context7, Frontend Design, Code Review |
| 3 — Storefront | Context7, Frontend Design, Playwright, Code Review, Security Guidance |
| 4 — Admin + Demo MFE | Context7, Feature Dev, Frontend Design, Code Review, Security Guidance |
| 5 — Dashboard dueño | Context7, Feature Dev, Frontend Design, Playwright, Code Review |
| 6 — Analytics + Super Admin | Context7, Feature Dev, Code Review |
| 7 — Billing | Context7, Feature Dev, Security Guidance, Code Review |
| 8 — Infra Prod | GitHub, Security Guidance, Code Review |

---

## Configuración en `.mcp.json` (project-scoped, no commitear)

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "TU_KEY"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--headless"]
    }
  }
}
```

> GitHub va separado porque usa HTTP transport, no stdio.

Agrega `.mcp.json` al `.gitignore` — contiene tokens.

---

## Troubleshooting

**context7 no conecta:**
```bash
npx ctx7 setup --claude --api-key TU_KEY
```

**GitHub retorna 401:**
- Verifica que el PAT tenga permisos `repo` y `read:org`
- Regenera el token si tiene más de 90 días

**Playwright no abre navegador:**
```bash
npx playwright install chromium
```

**Plugin no aparece en `/help`:**
```
/plugin list
/plugin install nombre@claude-plugins-official
```
