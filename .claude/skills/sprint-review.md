---
name: sprint-review
description: Reviews completed sprint against DoD, runs checks, generates MR description
---

For sprint number $ARGUMENTS:

1. Read docs/planning/sprints/sprint-$ARGUMENTS-*.md — extract the "Definition of Done" checklist
2. Run: pnpm typecheck 2>&1 | tail -5
3. Run: pnpm lint 2>&1 | tail -5  
4. Run: pnpm test 2>&1 | tail -10 (if test script exists)
5. Run: git diff develop...HEAD --name-only to list changed files
6. Compare changed files against "Archivos a crear/modificar/eliminar" in the sprint file
7. Check each DoD item: ✅ done or ❌ missing
8. Generate an MR description using the sprint's objective and completed tasks

Output format:
## Sprint $ARGUMENTS Review

### DoD Status
[checklist]

### typecheck: ✅/❌
### lint: ✅/❌  
### tests: ✅/❌

### MR Description (ready to paste)
[title and body]

### Missing before merge:
[list or "Nothing — ready to merge"]
