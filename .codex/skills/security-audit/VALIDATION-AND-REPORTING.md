# Validation, Reporting, and Verification

### Phase 3: Validate findings

Consolidate findings sharing a root cause before validation. Assign each candidate to a local `reviewer` who did not author it and tries to disprove it. Batch related findings into one scope; run no more than three specialists concurrently and use further waves only as needed. The coordinator owns artifact writes. Preserve evidence categories from SKILL.md: confirmed vulnerabilities, deployment-dependent hypotheses, and hardening.

Each validation agent prompt should:

1. State the specific finding being validated (title, claimed attack, claimed impact)
2. Ask the agent to read the exact code paths and verify each step of the trace
3. Ask it to apply these tests (the adversarial, Phase 3 form of the canonical validation rules in [HUNTING.md](HUNTING.md) — here a separate agent tries to make each one fail):

**Validation tests:**

1. **Exploitation test**: Read the actual code at each step of the trace. Does the data flow work as claimed? Can you construct the exact input (HTTP request, CLI invocation, API call, crafted file, etc.) that triggers this?
2. **Impact test**: What does the attacker actually get? If the answer is "they learn field names" or "they cause an error", that's not meaningful impact — not a finding on its own (at most a building block for a chain).
3. **Baseline test**: Does the identified comparable have the same pattern? If yes, has it been exploited? If never exploited in years of production use, understand why before reporting.
4. **Mitigation test**: Is there another layer that prevents exploitation? Check middleware, database constraints, framework defaults.
5. **Parser/runtime behavior test**: If the exploit depends on how a parser or runtime handles specific input, verify against the actual spec or implementation — do not reason from intuition.

Tell each validation agent:

```
Your job is to DISPROVE this finding. Read the actual source code at every step. If you cannot disprove it, confirm it with the exact code that makes it exploitable. Return one of:
- "CONFIRMED: [explanation of why it's real, with code evidence]"
- "REJECTED: [explanation of what the finding got wrong, with code evidence]"
- "REQUIRES DEPLOYMENT TESTING: [missing fact and safe future verification]"
```

**Kill false positives aggressively, but don't kill real findings.** A short report with 3 real findings is worth more than a long report with 30 theoretical ones. An honest "nothing found" is valid — but push hard before reaching that conclusion.

### Phase 4: Report

Write the report to the output directory established in Setup.

**Output files:**

1. `REPORT.md` -- Main report with:
    - One-paragraph executive summary (honest assessment of security posture)
    - Identified baseline and how this application compares
    - Findings table (severity, title, one-line description)
    - Each finding with: file path, concrete attack scenario, impact, recommended fix
    - Deployment-testing hypotheses section (missing evidence and safe verification plan; excluded from confirmed count and JSON)
    - Coverage and limitations section
    - Hardening notes section (defense-in-depth suggestions, NOT findings)
    - Positive patterns section (what the codebase does well -- this calibrates trust in the audit)

2. `FINDINGS-DETAIL.md` -- For each finding rated MEDIUM or above:
    - Complete data flow from input to sink with file:line references
    - Exact HTTP request(s) to trigger
    - What the attacker gets
    - How the baseline comparable handles the same scenario

Keep it short. If the report is longer than the codebase deserves, you're padding.

### Phase 5: Structured output and schema check

For every confirmed finding that survived Phase 3 validation (and any explicitly retained rejected candidates), produce a structured JSON object conforming to the schema defined in `report-schema.json` (in the same directory as this skill file — read it via the Read tool before writing output). Write the result to `<output-dir>/findings.json`.

The schema supports two verdict types via `oneOf`:

- **`confirmed`** — a validated vulnerability with full trace, execution, and remediation
- **`rejected`** — a finding that was investigated and determined to be factually incorrect

**Before writing `findings.json`:**

1. Read `report-schema.json` from this skill's directory. Follow it exactly — `additionalProperties: false` is enforced, so extra fields will make the output invalid.
2. For each finding, populate every required field. If you cannot fill `trace` with real file paths and line numbers verified against the source, the finding is not sufficiently verified — go back and verify it or reject it. Mind the required fields that aren't self-evident: `intended_behavior` (what the code is _supposed_ to do, so the defect is legible), `confidence` (`low`/`medium`/`high`, with a reason), and the `severity` object (`likelihood`/`impact`/`overall_severity`). All `severity` scores use the schema's **lowercase** enum — `informational`/`low`/`medium`/`high`/`critical`; the UPPERCASE tiers in SKILL.md and REPORT.md are prose labels, not valid JSON values.
3. Run `node <skill-dir>/validate-findings.cjs <output-dir>/findings.json` to validate. It checks required fields, enum values, structural constraints, and `additionalProperties`. This is a structural check only — it confirms the JSON conforms to the schema, not that the findings are correct. Factual verification is Phase 6's job. Fix any failures before proceeding.

### Phase 6: Independent verification

Have a local `reviewer` who did not author the findings check the finished JSON and reports against source evidence. The Phase 3 independent validator can perform this final check; reuse settled evidence and focus on factual accuracy of the outputs. Batch related findings, at most three concurrent specialists, and do not create one agent per finding. Give the verifier the relevant JSON objects, artifacts and source paths with this brief:

```
You are an independent verifier. You did NOT write this finding. Your job is to read the actual source code and verify that every factual claim is correct.

1. Read the file and line number cited in EVERY trace step. Verify:
   - The file exists at that path
   - The line number matches the described code
   - The scope (function name) is correct
   - The description accurately reflects what the code does

2. Verify the root_cause statement by reading the cited file and confirming the described defect exists.

3. Verify the execution payloads would actually work, in terms that fit the target:
   - Does the entry point exist as claimed — the endpoint/URL, CLI command, exported function, syscall/ioctl, message handler, or tool the attacker invokes?
   - Does the invocation match — HTTP method, argument shape, call signature, or message format?
   - Would the input survive validation and parsing on the real code path?
   - Would the relevant authentication, authorization, or ownership check pass as described?

4. Verify conditions are complete — are there prerequisites the finding missed?

5. Check the remediation code_changes — would the fix actually prevent the attack without breaking normal functionality?

6. Verify `intended_behavior` accurately states what the code should do, and that `confidence` matches the strength of the evidence — don't leave `high` on a claim you couldn't fully trace.

Return one of:
- "VERIFIED" — all claims checked out against the source
- "CORRECTED: [field]: [what was wrong] → [what it should be]" — factual error in a specific field
- "REJECTED: [reason]" — the finding is fundamentally wrong
- "REQUIRES DEPLOYMENT TESTING: [missing evidence]" — confirmation depends on unverified infrastructure/runtime behavior
```

Apply the agent's corrections:

- **VERIFIED** findings: no changes needed
- **CORRECTED** findings: update the specific fields in `findings.json`, re-run the schema validation script
- **REQUIRES DEPLOYMENT TESTING** findings: remove from confirmed JSON and move to the report hypothesis section, recording missing evidence.
- **REJECTED** findings: change their `verdict` to `"rejected"` with the agent's reason, or remove them entirely

After applying corrections, reconcile the prose deliverables: update `REPORT.md` and `FINDINGS-DETAIL.md` so they match the final `findings.json`. Remove or amend any finding the verification gate rejected or corrected — the human-readable report and the machine-readable output must not disagree.

This is the final quality gate. Do not skip it.
