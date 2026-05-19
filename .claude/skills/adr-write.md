---
name: adr-write
description: Creates a formal Architecture Decision Record from a brief description
---

Create an ADR for this decision: $ARGUMENTS

Steps:
1. Run: ls docs/architecture/decisions/ADR-*.md 2>/dev/null | sort | tail -1 to get the last ADR number. Next = last + 1. If none exist, start at 001.
2. Create slug from the decision description (lowercase, hyphens)
3. Write the ADR to docs/architecture/decisions/ADR-{N}-{slug}.md using this template:

# ADR-{N}: {Title}
Date: {today}
Status: propuesto

## Contexto
{Describe the situation requiring a decision}

## Decisión
{One clear sentence: "Usaremos X porque Y"}

## Consecuencias
**Positivas:**
- 

**Negativas:**
- 

**Riesgos:**
- 

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|-------------|-------------------|

## Spike requerido
- [ ] Sí / No

4. Also write the same ADR to ~/obsidian/architect-brain/30-Architecture/ADRs/ADR-{N}-{slug}.md
5. Update (or create) docs/architecture/decisions/index.md with a new row: | ADR-{N} | {title} | {date} | propuesto |
6. Report: "ADR-{N} created at docs/architecture/decisions/ADR-{N}-{slug}.md"
