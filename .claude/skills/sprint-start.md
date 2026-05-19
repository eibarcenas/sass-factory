---
name: sprint-start
description: Starts a sprint - creates branch from develop, reads sprint file, creates todos, spawns agents
---

Read the sprint file at docs/planning/sprints/sprint-$ARGUMENTS-*.md (use glob, the N matches the argument).

Then:
1. Run: git checkout develop && git pull && git checkout -b sprint/$ARGUMENTS-$(grep "^Branch:" docs/planning/sprints/sprint-$ARGUMENTS-*.md | sed 's/.*sprint\///' | tr -d '`')
2. Create a TodoWrite list from the "Tasks" section of the sprint file
3. Read the "Agentes asignados" section and report which agents to spawn
4. Report: branch created, todos set, ready to execute Sprint $ARGUMENTS

If the sprint file doesn't exist, list available sprint files in docs/planning/sprints/.
