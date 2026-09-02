# Progress

Execution log for the [plan](./plan.md). Boxes get ticked as work lands; the `git log` of this file
is the real record of when each thing happened.

| | |
|---|---|
| **System** | **Koala** · repo `koalakanibal/koala-ds` · package `@koalakanibal/koala` |
| **Current phase** | P0 · Foundations and scaffolding |
| **Next action** | Install the base toolchain (turbo, vitest, eslint, prettier, changesets) |
| **Hours so far** | 0 / ≈115 |
| **Latest version** | — |
| **Components** | Button · TextField · Tabs · Card *(Dialog if week 8 has room)* |
| **Open decisions** | which dependencies beyond the plan's seven · where the ESLint config lives |

**Overall progress:** `█░░░░░░░░░░░░░░░░░░░` 7 / 107 steps

---

## How this works

**Who executes each step.** Every step is offered as a choice: the human runs it or the agent does.
The agent states the approach, the human approves or corrects it, and whoever does not execute
verifies. This is a deliberate cost in speed: the point of this project is the process, and a
process you have only watched an agent perform is not one you have learned.

**Phase kickoff (10 min, conversational).** Every phase opens with a spoken review before touching
anything: where we actually are, what the previous phase left behind, and what gets cut if time has
slipped. This is the deliberate substitute for writing a plan per phase — it reflects reality at that
moment instead of a prediction made weeks earlier, and it leaves no dead documentation to maintain.

**And every kickoff includes a poke-holes pass.** Deliberately attack the plan for the phase about to
start: what is it assuming, what would make it wrong, what is missing. This exists because it already
paid for itself once — the plan spent hours sized for an objective that had been dropped, and nobody
noticed from inside it. Ten minutes of adversarial reading is the cheapest step in this document.

**Phase brief (30 min, written).** Only in **P1** and **P4**, the phases with creative divergence,
where the plan cannot decide for you because the decisions are matters of judgement. Half a page: the
question you want to answer, the constraints, and the criteria you will choose by. Written *before*
opening Claude Design, and a legitimate design artefact for the case study.

**Component phases get no phase plan**: each component's plan is its `.spec.md`. Do not duplicate it.

**The design pass is a step, not a mood.** Between the implementation and the stories, every
component gets explicit design hours: full state matrix, focus treatment, motion, optical review,
both themes. The agent scaffolds and propagates in Figma; the human makes every visual call. If the
agent decides, the case study section *"what the AI proposed and what I decided"* has nothing in it.

**The second-time rule.** Skills, hooks and subagents are created the *second* time you do a task by
hand, never the first. Encoding a workflow you have not yet validated is how unused tooling
accumulates.

---

## P0 · Foundations and scaffolding — 7/16 · 12 h

> Goal: `0.0.1` on npm, CI green and Pages live **before** a single component is written.

- [x] Phase kickoff (10 min)
- [x] `git init -b main` + `pnpm init` + public repo created on GitHub
- [x] `pnpm-workspace.yaml` with `packages/*` and `apps/*`
- [x] Base toolchain installed (typescript, turbo, vitest, eslint, prettier, changesets)
- [x] `pnpm changeset init`
- [ ] `packages/tokens` with a minimal three-colour JSON
- [ ] `packages/ui` with Vite in library mode + a trivial component + correct `exports`, plus
      `publishConfig: { "access": "public" }` — scoped packages publish private by default
- [ ] `.github/workflows/ci.yml` — install · lint · typecheck · test · build
- [ ] Bundle-size budget in CI — catch weight as it is added, not once it is a problem
- [ ] `main` protected + `pull_request_template.md` + `CODEOWNERS`
- [ ] `0.0.1` versioned with a changeset and published to npm
- [ ] GitHub Pages live (source: GitHub Actions) serving a placeholder
- [x] `AGENTS.md` at the root + `CLAUDE.md` pointing at it
- [ ] `standards` skill — WCAG 2.2 AA · ARIA APG · DTCG · semver. **Links the source** and translates
      it into checkable rules; never paraphrases the spec from memory
- [ ] Hook `PostToolUse` on `packages/ui/**` running the tests for the edited file
- [x] ADR `0001-monorepo.md`

**P0 milestone** — [ ] example PR merged with CI green · [ ] `0.0.1` on npm · [ ] Pages responds

---

## P1 · Visual system and tokens — 0/16 · 18 h

> The phase this project exists to practise.

- [ ] Phase kickoff (10 min)
- [ ] **P1 brief** — what personality the system is after, what constrains it (accessibility, two
      modes, two brands, density), and the criteria for choosing between the three directions.
      Written *before* opening Claude Design, so the choice isn't made by visual seduction.
- [ ] Divergence session with Claude Design → three complete visual directions
- [ ] All three directions exported and kept (case study material)
- [ ] **Read the mockups against the spec** and list what they expose as missing — a mockup is a gap
      detector, not just a picture
- [ ] Direction chosen + ADR `0002-visual-direction.md` (what was rejected and why)
- [ ] **Colour a ·** Same ramp in HSL and in OKLCH, side by side — see why lightness has to be
      perceptually uniform before touching a library
- [ ] **Colour b ·** One family built line by line, output inspected at each step: what `culori`
      does, and where its job ends (build-time only — consumers get custom properties, not JS)
- [ ] **Colour c ·** Generalise to the remaining families
- [ ] ADR `0004-why-oklch.md` — **written by you**: why OKLCH over HSL, why this library over
      Color.js or chroma.js, and what it costs
- [ ] Spacing, radii, typography, elevation **and motion** scales (durations + easings)
- [ ] Figma: `Primitives` collection (no modes) — agent builds, you decide the contents
- [ ] Figma: `Semantic` collection with `light` / `dark` modes, not a single literal hex
- [ ] Export to DTCG JSON → `packages/tokens/src/` + Style Dictionary emitting css/ts/json
- [ ] **Theming architecture** — scoping via `[data-koala-theme]` (not only `:root`), themeable axes
      defined: colour, radii, density, typography → ADR `0003-token-architecture.md`
- [ ] Token tests: AA contrast in both modes · no semantic pointing at a literal · no gaps in the
      scale · **no component referencing a primitive**

**P1 milestone** — [ ] a Figma change reaches `tokens.css` via a PR · [ ] contrast tests green ·
[ ] three ADRs (0002, 0003, 0004) · [ ] `token-pipeline` skill

---

## P2 · Button and TextField — 0/19 · 22 h

- [ ] Phase kickoff (10 min)

> The eleven-step per-component cycle lives in the [plan](./plan.md#p2--button-and-textfield--22-h--weeks-23).
> Rule: if you are writing props before the `.spec.md`, stop.

### Button — 11 h (8 engineering + 3 design)
- [ ] `Button.spec.md` — the contract in prose: states, variants, keyboard, ARIA, edge cases
- [ ] **Approach stated and corrected before any code is written**
- [ ] Tests running red (one `describe` per contract section)
- [ ] Minimal implementation → green → refactor
- [ ] **Design pass** — full state matrix (rest/hover/press/focus/disabled/loading), focus treatment,
      motion, optical review, both themes. You resolve one state; the agent propagates the matrix
- [ ] **Review the tests as their own artefact** + break the component on purpose and confirm
      something goes red. Green does not mean good
- [ ] `vitest-axe` across every variant and state
- [ ] **Adversarial pass** — overlong content, absurd props, deep nesting, 200 % zoom, RTL
- [ ] Stories (all variants, both modes, second theme) + changeset + PR merged
- [ ] `component-tdd` and `a11y-audit` skills created out of this cycle
- [ ] `AGENTS.md` trimmed as those skills land — each rule whose method moved out becomes a one-line
      pointer, not a deletion
- [ ] `ds-conventions` + `ui-craft` skills — token naming, props, component anatomy, the mandatory
      state matrix, motion scale. **Dictated by you**, written fresh for this repo

### TextField — 9 h (7 engineering + 2 design)
- [ ] `TextField.spec.md` with label/help/error specified as one contract
- [ ] Approach stated and corrected before any code is written
- [ ] Full TDD cycle + test review + axe
- [ ] Adversarial pass
- [ ] **Design pass** — error and focus states, and how an error reads without relying on colour
- [ ] Stories + changeset + PR merged

**P2 milestone** — [ ] two components with contract, tests, design pass, green axe and stories ·
[ ] four skills working · [ ] `0.2.0` published

---

## P3 · Tabs and Card — 0/15 · 13 h

> Same standard, less time, because the method now exists.

- [ ] Phase kickoff (10 min)
- [ ] `a11y-reviewer` subagent with a clean context (audits without remembering writing the code)

### Tabs — 7 h (5 + 2)
- [ ] `Tabs.spec.md` + keyboard matrix (roving tabindex)
- [ ] TDD cycle + a Playwright test for real keyboard behaviour
- [ ] **Design pass** — the selected indicator and its motion
- [ ] Adversarial pass + test review
- [ ] ADR: automatic vs manual activation
- [ ] Stories + changeset + PR merged

### Card — 6 h (4 + 2)
- [ ] `Card.spec.md` — composition via slots, not a props API
- [ ] TDD cycle + axe
- [ ] **Design pass** — surface, elevation, radius and spacing across both brands. The purest token
      consumer in the system
- [ ] Adversarial pass + test review
- [ ] ADR: when a card should and should not be a link
- [ ] Stories + changeset + PR merged

- [ ] `0.5.0` published + a documented manual screen reader pass on each of the four

**P3 milestone** — [ ] four complete components · [ ] `0.5.0`

---

## P4 · Storybook and the site — 0/13 · 20 h

> One Astro app that is both the landing and the documentation.

- [ ] Phase kickoff (10 min)
- [ ] **P4 brief** — who reads the site and what they need, what the home page has to answer in ten
      seconds, and what will *not* be on it so Storybook still has a job
- [ ] Storybook: autodocs with typed props
- [ ] `component-docs` skill with the fixed MDX structure
- [ ] Four MDX files: Overview · Anatomy · Usage · Do & Don't · Props · A11y · Design decisions
- [ ] Landing mockups with Claude Design (hero, section rhythm, the long scroll)
- [ ] `apps/site` in Astro, with Vue islands
- [ ] `/` — the landing: hero, what Koala is, live demos
- [ ] `/foundations` — colour, typography, spacing read live from `tokens.json` (no copied hex)
- [ ] `/components/*` — gallery with a playground
- [ ] **Second brand theme** (one JSON of semantics) + **brand switcher on the landing**
- [ ] `/decisions` — the ADRs, rendered
- [ ] Deploy: site at the Pages root, Storybook at `/storybook`

**P4 milestone** — [ ] site live · [ ] colour docs generated from the real tokens · [ ] brand
switcher working

---

## P5 · Visual regression and a real release — 0/10 · 12 h

- [ ] Phase kickoff (10 min)
- [ ] Chromatic connected + baseline of the four components in light and dark
- [ ] TurboSnap enabled
- [ ] Chromatic check required before merging
- [ ] Token change provoked on purpose → diff approved → **screenshot saved for the case study**
- [ ] `docs/versioning.md`: what counts as breaking in a design system (tokens, internal DOM, props)
- [ ] `release.yml` with the Changesets action (version PR → npm + tag + GitHub Release)
- [ ] Deprecation policy and migration guide
- [ ] *(optional)* GitHub Packages as a second destination + ADR comparing both registries
- [ ] `1.0.0` with a hand-written major changeset explaining the stability commitment

**P5 milestone** — [ ] `1.0.0` on npm with CHANGELOG and Release · [ ] Chromatic blocking PRs ·
[ ] `release-check` skill

---

## P6 · React port, smoke test and the first real bug — 0/8 · 8 h

> Proving the two claims the project has been making.

- [ ] Phase kickoff (10 min)
- [ ] **npm smoke test** — a CI job that installs `@koalakanibal/koala` from the registry into a
      clean directory and typechecks a sample import. Replaces the old separate portfolio repo
- [ ] **Friction list** fed as things surface: missing exports, unresolved types, `sideEffects`
      eating the stylesheet (→ log, below)
- [ ] **Each bug reproduced as a failing test first**, then fixed at the cause, not the symptom
- [ ] **Regression tests left behind** so none of them can return
- [ ] Release `1.1.0` fixing what the smoke test surfaced
- [ ] `packages/ui-react`: `Button` and `TextField` reusing the same `.spec.md` and the same CSS
- [ ] React and Vue islands coexisting on the same page of the site, identical

**P6 milestone** — [ ] smoke test green in CI · [ ] React port working

---

## P7 · Case study — 0/10 · 10 h

- [ ] Phase kickoff (10 min) — with the whole friction log in front of you
- [ ] 1 · The thesis in one sentence
- [ ] 2 · The constraints
- [ ] 3 · Four decisions with real trade-offs (what was lost by choosing)
- [ ] 4 · The PR that tells everything, with screenshots
- [ ] 5 · The friction — *the section that convinces* (source: the log)
- [ ] 6 · What the AI proposed and what I decided — including what the agent propagated in Figma
      versus what you resolved by hand
- [ ] 7 · Evidence in numbers (coverage, axe, bundle, release time, ADR count)
- [ ] 8 · What I left out and what I'd do differently
- [ ] Repo README rewritten: the same story in twenty lines

**P7 milestone** — [ ] case study published on the site

---

## Week 8 · Buffer

Not optional padding. Every project of this shape overruns somewhere, and having the overrun planned
is what stops it becoming abandonment. If nothing overruns, week 8 buys **Dialog** as a fifth
component — the best engineering lesson left in the deferred set.

---

## Friction log

> Not an optional diary. Every entry here becomes a sentence in the case study (P7 · section 5).
> Write it **while it is hot**: what broke, what took longer than expected, what changed your mind.
>
> Format: `**YYYY-MM-DD** — what happened → what I changed.` Two or three lines. Technical detail
> belongs in the commit message.

**2026-08-28** — The plan assumed publishing to npm, which was never in the original brief; it was
inferred rather than decided → registry made an explicit decision with three options and an ADR
planned.

**2026-08-28** — The `review-before-commit` hook did not fire on the very commits that created it:
Claude Code loads hooks at session start, so a newly written hook is inert until the session is
restarted → worth remembering when the `PostToolUse` test hook lands later in P0. The rule held
anyway because approval was requested by hand, which is the point: the hook is a guarantee, not the
rule itself.

**2026-08-28** — Reviewing the plan against the actual goal exposed two errors at once. The plan's
phase hours summed to 124 while its own schedule table said 106 — they had never been reconciled. And
the plan was still sized for "portfolio to find work", an objective dropped hours earlier, so the
scope had never been recalibrated → full rewrite to v2. The lesson worth keeping: **a plan that is
not re-read against the goal drifts silently**, and the drift is invisible from inside it.

**2026-08-28** — The plan budgeted contract, tests, axe, Playwright, stories and PR per component —
and not one hour of design. For a design system built by a designer that is backwards → the design
pass became a required step in the cycle, and four well-crafted components replaced six correct ones
for fewer hours.

**2026-08-31** — A named next action ("install the base toolchain") was read as approval of the
approach, and the agent ran `pnpm add` immediately: seven dependencies in, TypeScript silently
resolving to 7.0.x, everything reverted → the approach step was generalised from components to the
whole repo, and who executes each step became an explicit choice.

**2026-08-31** — The `review-before-commit` hook was removed. It promised the staged diff in the
approval prompt and delivered `--stat`: file names and line counts, which can be approved as blindly
as nothing at all. It also appears never to have fired in a session → the rule stayed in `AGENTS.md`,
the mechanism went, and **an unverified guarantee turned out to be worse than an honest suggestion**,
because it collects trust it has not earned.

**2026-08-31** — Asked where the "`AGENTS.md` must fit one screen" rule came from, and it came from
nowhere: it was written into the plan two days earlier, on a day the file was already 105 lines long.
It was never true, not for a minute → the number was replaced by the principle it was standing in
for, and the lesson is that a plan can manufacture its own norms and then be measured against them.

**2026-09-01** — `vue-tsc` cannot load TypeScript 7, though its dependency range claims it can →
pinned to `~6.0.3`. A five-minute spike found what would otherwise have surfaced two branches later.

---

## Decisions that changed from the plan

> When reality contradicts the [plan](./plan.md), edit it **and** note it here. The fact that the
> prospective plan and the retrospective case study do not quite match is exactly what makes them
> interesting.

| Date | Was | Became | Why |
|---|---|---|---|
| 2026-08-28 | Package registry assumed as npm | Explicit decision: npm, GitHub Packages optional in P5 | Scope inferred from "real release process", never actually agreed |
| 2026-08-28 | Goal included "portfolio to find work" | A small system to practise tokens, plus a landing built from it | Changes the weight of everything downstream |
| 2026-08-28 | Light/dark only | Multi-theme scoped via `[data-koala-theme]` | Light/dark are two modes of one theme; a reusable library needs more |
| 2026-08-28 | Working docs in Spanish | Everything in the repo in English | Public repo; mixed languages weaken it |
| 2026-08-28 | Six components (incl. Select, Dialog, Toast) | Four: Button, TextField, Tabs, Card | Select and Toast are application components a landing never uses. The expensive part is the method, not the Nth component — they are cheap to add later |
| 2026-08-28 | No design time in the cycle | A design pass per component, 2–3 h each | The plan was rigorous about correctness and silent about craft |
| 2026-08-28 | Separate repo for the portfolio/CV | The landing and the docs site are one Astro app in this repo | The CV was never the point; a CI smoke test preserves the npm-consumption proof for 2 h |
| 2026-08-28 | 124 h / 7 weeks (stated as 106) | 111 h / 7 weeks + a buffer week | Arithmetic reconciled, and the overrun planned instead of hoped away |
| 2026-08-28 | Process invented ad hoc | Process aligned to the six Unlearn workflows, 115 h | Eight concrete changes: poke-holes pass, state-the-approach step, test-quality review, dependency justification, adversarial pass, review feedback loop, a home for the debugging workflow, and mockups reframed as gap detectors |
| 2026-08-28 | "OKLCH ramp generated with culori" as one checkbox | Three explained steps + an ADR written by hand | A finished script handed over teaches nothing. The colour pipeline is the reason the project exists, so it is built to be understood, not just to work |
| 2026-08-31 | "Human decides, agent propagates" | Human decides, and chooses who executes each step | Watching an agent execute teaches the outcome, not the process. The project exists to learn the process |
| 2026-08-31 | Hook `review-before-commit` as the guarantee behind commit approval | Hook removed; the rule stands on its own, carried by showing the full diff in the conversation | It showed file names and line counts, not the diff, so it could be approved as blindly as nothing — and it never fired |
| 2026-08-31 | `AGENTS.md` capped at one screen | Short enough that every line still gets read, and it shrinks as each skill lands | The cap came from nothing and was already false the day it was written. `AGENTS.md` holds the rule, the skill holds the method |
