---
name: gherkin-to-test
description: Converts Gherkin Feature/Scenario blocks into failing Vitest or Playwright tests
---

Find Gherkin for feature: $ARGUMENTS

Steps:
1. Search docs/planning/sprints/*.md and docs/planning/initiatives-epics.md for Feature blocks matching "$ARGUMENTS"
2. For each Scenario:
   - If it involves browser/UI interaction → generate Playwright spec
   - If it's pure logic (no browser) → generate Vitest unit test
3. Generate tests in FAILING state (they should fail before implementation — TDD red phase)
4. Place Vitest tests in the correct __tests__ directory next to the code they'll test
5. Place Playwright specs in e2e/ directory
6. Each test should have a comment: // TDD: RED phase — implement to make this pass
7. Report: list of test files created and what each covers
