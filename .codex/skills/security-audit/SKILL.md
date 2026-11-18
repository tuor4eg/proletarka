---
name: security-audit
description: Conduct a requested security audit of the proletarka codebase with scoped investigation, independent validation, and evidence-based reports. Use for explicit vulnerability audits; ordinary code review does not require this workflow.
---

# Security Audit

You are a security auditor. Your job is to find **exploitable vulnerabilities with real impact**.

## Local orchestration and authorization

Use the repository's `.codex/agents/reviewer.md` definition for focused security investigation and independent validation, following `AGENTS.md`. The coordinator owns reconnaissance synthesis, artifact writing, deduplication, and final integration. Do not create generic `research` or `general` roles.

Use at most **three concurrent specialists**, leaving the fourth slot for the coordinator. Choose scopes and depth by risk; one investigator may be enough. Run additional scopes in bounded waves and reuse agents when useful. Specialists do not spawn more agents; return uncovered areas to the coordinator. Give each specialist a concise brief, relevant architecture facts and file paths, evidence requirements, and the safety constraints below; do not copy the entire architecture or chat by default.

Validation must be independent of the author of the claim. A reviewer may validate another reviewer's work. Batch related findings; do not launch a new agent for every finding. The final factual check can be performed by the independent validator from Phase 3 on the finished outputs, without repeating settled investigation.

This skill authorizes source inspection, artifact creation, and isolated local reproductions within the user's task. It does **not** authorize production mutations, destructive checks, load tests, outbound exploit requests, or use of live credentials against external systems. Use disposable local fixtures; do not connect tests to production databases, S3 buckets, or webhooks. Record infrastructure-dependent hypotheses for later authorized deployment testing.

## Setup and evidence categories

Target defaults to the current repository. Unless the user specifies otherwise, write all audit artifacts under `.security-audits/proletarka/run-N/`, choosing the next unused integer. Inspect prior `findings.json` and reports under `.security-audits/proletarka/` to avoid duplicate investigation and identify coverage gaps; recheck earlier findings only when changes or conflicting evidence justify it.

The coordinator writes:

- `architecture.md` — trust boundaries, surfaces, relevant files, coverage and prior-run context.
- `REPORT.md` — findings, deployment hypotheses, hardening, positive controls, and limitations in distinct sections.
- `FINDINGS-DETAIL.md` — complete traces for confirmed MEDIUM+ findings.
- `findings.json` — confirmed/rejected findings conforming to the bundled schema.

Keep three evidence categories separate:

1. **Confirmed vulnerability:** concrete attacker, prerequisites, input sequence, trace and meaningful impact supported by code evidence; use isolated dynamic proof when runtime behavior is material.
2. **Hypothesis requiring deployment testing:** a missing infrastructure/runtime fact prevents confirmation. State the exact missing fact and safe future test; do not present it as confirmed or include it in the confirmed findings count or JSON.
3. **Hardening:** a defense-in-depth gap or recommendation without a standalone exploit. Keep it outside severity-rated findings and JSON.

An audit is bounded by its inspected surfaces and evidence; document coverage gaps without claiming a quantified detection rate or requiring repeat runs.

## Core Principles

### Only report what you can exploit

Every finding must have a concrete attack scenario: who is the attacker, what do they do, and what do they get? "An attacker could theoretically..." is not a finding. "Send this request, get this result" is.

### Confirm dynamically when you can

This is a source-first audit, but a claim you can execute beats one you can only argue. Where the target is locally buildable — a parser, a library, a CLI, a native component — build and run it: reproduce the crash, run the payload, diff the two parsers on the same bytes. Better still, **extract the suspect code into a minimal standalone harness** and test the hypothesis in isolation — fuzz the one function, feed it the crafted input, watch what it does. Where confirmation needs infrastructure you don't have — a proxy chain, a live cache, production auth — you cannot confirm from source alone: mark it "requires deployment testing" and do not report it as confirmed. Dynamic evidence is what resolves the memory-safety and request-framing classes that static reading leaves ambiguous.

### Determine the baseline dynamically

In Phase 1, identify what this application is and what comparable applications exist. Use those comparables to calibrate -- not to dismiss findings, but to focus effort. If the comparable has the same pattern and it's been exploited there, that's a STRONGER finding, not a weaker one. If the comparable has the same pattern and nobody's ever exploited it in 20 years, you should understand why before reporting it.

Do NOT hardcode a specific comparable. A CMS gets compared to other CMSes. An API gateway gets compared to other API gateways. A novel application may have no meaningful comparable.

### Defense-in-depth gaps are not vulnerabilities

If Layer A prevents the attack, the absence of Layer B is a hardening note, not a finding. Report it separately if you want, but do not inflate its severity.

### Severity requires impact

Severity is the combination of **likelihood** (how easy to exploit, what access is needed) and **impact** (what damage is achieved). Use both axes:

- **CRITICAL**: Unauthenticated RCE, full database dump, admin account takeover without credentials
- **HIGH**: Authenticated RCE, SQL injection with data exfiltration, stored XSS that fires for all users, auth bypass. Also: any finding where the RBAC/permission model is _completely_ defeated for an action — e.g., a user can perform an action that the system explicitly gates behind a higher role, and the action has real consequences (publishing content, deleting resources, modifying other users' data).
- **MEDIUM**: Targeted XSS requiring specific conditions, CSRF with meaningful state change, information disclosure of secrets/credentials. Also: business logic bypasses with real but limited consequences — e.g., the action is possible but requires authentication, or the impact is confined to the attacker's own data, or the bypass requires uncommon conditions.
- **LOW**: Information disclosure of non-secret data, DoS requiring sustained effort
- **INFORMATIONAL**: A confirmed but minimal-impact observation with no standalone exploit — useful mainly as a building block for another finding. Pure defense-in-depth gaps belong in hardening notes, not here.

The key distinction between HIGH and MEDIUM for business logic findings: **does the finding defeat an explicit security boundary?** Defeating one — acting past a role the system explicitly enforces — is HIGH; a data inconsistency, a finding that requires privileged access to exploit, or one with limited blast radius is MEDIUM.

If you cannot describe the concrete damage an attacker achieves, the severity is probably lower than you think.

These principles are enforced operationally by the **validation rules in [HUNTING.md](HUNTING.md)** — the canonical bar every hunter applies before reporting a finding, and that Phase 3 re-applies adversarially. The domain companion files add domain-specific checks on top of that bar; they do not replace it.

## Workflow overview

Use these phases, scaling investigation to the target and reusing established evidence:

1. **Recon** — Run Phase 1 from [RECONNAISSANCE.md](RECONNAISSANCE.md) to map the application's architecture, trust boundaries, and input surfaces.
2. **Hunt** — Use [HUNTING.md](HUNTING.md) for Phase 2 orchestration, methodology, and validation rules; select scopes from [ATTACK-CLASSES.md](ATTACK-CLASSES.md), which routes relevant targets to companion files; read only applicable sections in ([MEMORY-SAFETY-AND-BINARY.md](MEMORY-SAFETY-AND-BINARY.md), [AI-AND-LLM.md](AI-AND-LLM.md), [WEB-PROTOCOL-AND-AUTH.md](WEB-PROTOCOL-AND-AUTH.md), [CLIENT-SIDE.md](CLIENT-SIDE.md)).
3. **Validate** — Use Phase 3 in [VALIDATION-AND-REPORTING.md](VALIDATION-AND-REPORTING.md) to consolidate duplicates and independently try to disprove every finding.
4. **Report** — Use Phase 4 in [VALIDATION-AND-REPORTING.md](VALIDATION-AND-REPORTING.md) to write `REPORT.md` and `FINDINGS-DETAIL.md`.
5. **Structured output** — Use Phase 5 in [VALIDATION-AND-REPORTING.md](VALIDATION-AND-REPORTING.md), `report-schema.json`, and `validate-findings.cjs` to write and validate `findings.json`.
6. **Independent verification** — Use Phase 6 in [VALIDATION-AND-REPORTING.md](VALIDATION-AND-REPORTING.md) to verify every factual claim and reconcile all outputs.

## Anti-Patterns to Avoid

These are the mistakes that make security audits useless:

1. **Listing everything that deviates from OWASP as a finding.** OWASP is a checklist, not a bug list. Every real application makes tradeoffs.
2. **Rating defense-in-depth gaps as HIGH/CRITICAL.** "Missing validateIdentifier where the query builder already quotes identifiers" is not HIGH severity.
3. **Ignoring the deployment model.** Rate limiting at the CDN layer is a valid architecture. Not every app needs application-level rate limiting.
4. **Treating designed behavior as a bug.** Understand the trust model before auditing. If the design says admins are fully trusted, admin-does-admin-things is not a finding.
5. **Padding the report with LOW findings to look thorough.** Ten LOWs don't make a useful report. Three MEDIUMs do.
6. **"Potential" findings without proof.** Keep unconfirmed leads in the deployment-hypotheses section with the missing evidence; never inflate them into confirmed findings.
7. **Ignoring what the codebase does well.** If auth is solid, say so. It builds trust in the findings you DO report and helps the team prioritize.
8. **Constructing exploits from incorrect parser/runtime assumptions.** The most convincing false positives come from reasoning "the parser/runtime will interpret this as..." without verifying. If your exploit depends on parser or runtime behavior, cite the spec or test it. Don't assume.
9. **Skipping business logic and creative attacks.** The standard vulnerability classes (SQLi, XSS, SSRF) are what every scanner checks. The value of a manual audit is finding the things scanners can't: logic errors, state machine violations, chained attacks, implicit trust assumptions.
10. **Giving up too easily.** "The codebase uses parameterized queries so there's no SQL injection" is a lazy conclusion. Check EVERY use of sql.raw(). Check dynamic identifiers. Check search/FTS. Check if there's a code path that bypasses the query builder. Push.
