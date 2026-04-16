# AGENTS.md

## Agent routing

Use specialized agents when the task clearly matches their role:

- `architect` — structure, naming, data model, boundaries, feature design
- `implementer` — code implementation
- `reviewer` — code review, business logic, edge cases, regressions, maintainability
- `doc_writer` — documentation, admin guides, UI wording, non-technical explanations

Do not overload one agent with work that belongs to another.

### Routing guidance

- Use `architect` when the task is about deciding how something should be designed before coding.
- Use `implementer` when the task is about making changes in the codebase.
- Use `reviewer` when the task is to check existing changes and find risks, bugs, regressions, weak spots, or missed scenarios.
- Use `doc_writer` when the task is to produce or improve documentation or explanatory text.

If the task starts with architecture and then moves into coding:

1. first use `architect`
2. then use `implementer`

If the task is already implemented and needs validation:

1. use `reviewer`

## Scope

Keep changes focused.
Do not rewrite unrelated code or documentation unless the task requires it.

## Uncertainty

Do not invent behavior that is not confirmed by code, UI, or task context.
If something is unclear, state it directly and proceed with the most useful grounded result.
