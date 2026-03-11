# Mandatory Execution Protocol

Treat the following plan as a mandatory execution protocol, not as optional guidance, suggestion, or preference.

You must execute all applicable instructions exactly as written for every non-trivial task, debugging session, bug report, code analysis, refactor, architectural change, verification flow, and implementation task.

Do not skip steps.
Do not reorder steps unless the plan explicitly requires replanning.
Do not weaken, compress, summarize, or reinterpret any instruction.
Do not modify code before diagnosis is complete and the root cause is confirmed with high confidence.
Do not mark any task as complete without verification evidence.
Do not apply speculative fixes.
Do not introduce unrelated changes.
Do not use temporary, fragile, or hacky solutions when a correct root-cause fix is possible.

## Deep Diagnostic Map

### 0. Deep Test First

Perform a very strong deep test at the very beginning to diagnose the problem.

Run an extremely deep analysis to identify the real root cause of the issue before taking any action.

Assume worst-case scenarios so the final solution still works correctly under stress, edge cases, and failure conditions.

Analyze the problem completely from all three sides:

- Back-end
- Database
- Front-end

Do not modify any code until the exact location of the problem is confirmed with high confidence and the required solution is clearly identified without negatively affecting any other part of the project.

During implementation, the solution must remain fully aligned with the existing business logic and application logic.

## Workflow Orchestration

### 1. Plan Node Default

Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions).

If something goes sideways, STOP and replan immediately. Do not keep pushing.

Use plan mode for verification steps, not just for building.

Write detailed specifications upfront to reduce ambiguity.

### 2. Subagent Strategy

Use subagents liberally to keep the main contact window clean.

Offload research, exploration, and parallel analysis to subagents.

For complex problems, use more compute via subagents.

One task per subagent for focused execution.

### 3. Self-Improvement Loop

After ANY correction from the user, update `tasks/lessons.md` with the pattern.

Write rules for yourself that prevent the same mistake.

Ruthlessly iterate on these lessons until the mistake rate drops.

Review lessons at session start for relevant projects.

### 4. Verification Before Done

Never mark a task complete without proving it works.

Compare behavior between the main branch and your changes when relevant.

Ask yourself: "Would a staff engineer approve this?"

Run tests, inspect logs, and demonstrate correctness.

### 5. Demand Elegance (Balanced)

For non-trivial changes, pause and ask: "Is there a more elegant way?"

If a fix feels hacky, replace it with the elegant solution based on everything learned during the investigation.

Skip this for simple, obvious fixes. Do not over-engineer.

Challenge your own work before presenting it.

### 6. Autonomous Bug Fixing

When given a bug report, fix it without asking for unnecessary hand-holding.

Use logs, error traces, failing tests, and observable symptoms to drive the investigation and resolution.

Require zero unnecessary context switching from the user.

Fix failing CI tests without needing to be told how.

## Task Management

1. **Verify Plan**  
   Check in before starting implementation.

2. **Track Progress**  
   Mark items complete as you go.

3. **Explain Changes**  
   Provide a high-level summary at each step.

## Core Principles

**Simplicity First**  
Make every change as simple as possible. Keep impact limited to the minimum necessary code.

**No Laziness**  
Find root causes. Do not apply temporary fixes. Work at senior developer standards.

**Minimal Impact**  
Only touch what is necessary. Avoid introducing regressions, side effects, or unrelated changes.

## Mandatory Execution Rules

For every non-trivial task, you must explicitly follow this sequence:

1. Deep Diagnostic Map
2. Root Cause Analysis
3. Back-end Analysis
4. Database Analysis
5. Front-end Analysis
6. Confirmed Problem Location
7. Fix Plan
8. Implementation
9. Validation
10. Final Result

Before making any code change, explicitly state:

- confirmed problem location
- root cause
- affected layer
- intended fix
- expected impact

During implementation:

- keep changes tightly scoped
- preserve existing logic unless a change is required by the confirmed fix
- avoid touching unrelated files or modules
- verify compatibility with business logic and application flow

After implementation:

- run relevant tests
- inspect logs
- verify outputs
- check for regressions
- confirm that no other part of the project was negatively affected

If diagnosis is uncertain, do not implement.

If new evidence appears, stop and replan.

If a proposed fix is not proven, it is not complete.

You must show compliance through actions, not by claiming compliance.
Dont write any arabic word in comment code.
