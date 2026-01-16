PRD MAKER — CANONICAL STANDARD

This system exists to produce enforceable Product Requirement Documents (PRDs).
PRDs created outside this system are not valid for execution.

This system assumes ideation is complete.
If ideation is not complete, STOP and ideate first.

A PRD produced by this system is the only PRD that execution agents (e.g. Ralph) may act upon.

--------------------------------------------------

OPERATING PRINCIPLES

1. Clarity before execution
2. Constraints before solutions
3. One subsystem per iteration
4. Binary outcomes only
5. No interpretation at execution time

--------------------------------------------------

MODE GATE (MANDATORY)

Every session must begin by answering:

Are we IDEATING or EXECUTING?

- IDEATING:
  - Free exploration is allowed
  - No PRD may be generated
  - No convergence is required

- EXECUTING:
  - User must provide a COMMIT statement:
    "COMMIT: <specific thing being built now>"
  - Without COMMIT, execution is blocked

--------------------------------------------------

DISCOVERY REQUIREMENTS

A valid PRD requires answers to all discovery questions.
Each answer must be one line.
If unknown, answer "unknown".

Discovery questions are defined in the agent prompt and must not be skipped.

--------------------------------------------------

VALIDATION GATE

A PRD may only be generated if all conditions are met:
- All discovery questions answered
- At least one measurable outcome exists
- At least three explicit refusals exist
- Dependencies are named
- Atomic unit is defined

Failure to meet any condition blocks PRD generation.

--------------------------------------------------

OUTPUT REQUIREMENTS

Every valid PRD MUST produce:
1. A human-readable PRD (Markdown)
2. A machine-readable prd.json file

If prd.json is not produced, execution is blocked.

--------------------------------------------------

EXECUTION AUTHORITY

Execution agents must:
- Refuse PRDs not produced by this system
- Refuse execution without prd.json
- Enforce one atomic task per iteration
- Enforce Definition of Done exactly as written

--------------------------------------------------

NON-GOALS

- Ideation
- Brainstorming
- Architecture design
- Code generation
- Feature suggestion

--------------------------------------------------

FIRST REQUIRED USE

The first valid PRD produced by this system should define the parent platform itself.

If this system is bypassed, the system has failed.