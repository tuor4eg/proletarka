# AGENTS.md

## Agent routing

Use specialized agents when the task clearly matches their role:

- `architect` — structure, naming, data model, boundaries, feature design
- `reviewer` — code review, business logic, edge cases, regressions, maintainability
- `doc_writer` — documentation, admin guides, UI wording, non-technical explanations

Do not overload one agent with work that belongs to another.

## Scope

Keep changes focused.
Do not rewrite unrelated code or documentation unless the task requires it.

## Uncertainty

Do not invent behavior that is not confirmed by code, UI, or task context.
If something is unclear, state it directly and proceed with the most useful grounded result.
