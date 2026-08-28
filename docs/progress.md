# Progress

Execution log for the [plan](./plan.md). Boxes get ticked as work lands; the `git log` of this file
is the real record of when each thing happened.

| | |
|---|---|
| **System** | **Koala** · repo `koalakanibal/koala-ds` · package `@koalakanibal/koala` |
| **Current phase** | P0 · Foundations and scaffolding |
| **Next action** | Create the public repo on GitHub |
| **Hours so far** | 0 / ≈106 |
| **Latest version** | — |
| **Open decisions** | None. *(Does the name drive the visual direction? → P1 brief)* |
| **Registry** | Public npm · GitHub Packages as an optional second destination in P5 (→ comparison ADR) |

**Overall progress:** `█░░░░░░░░░░░░░░░░░░░` 4 / 97 steps

---

## How this works

**Phase kickoff (10 min, conversational).** Every phase opens with a spoken review before touching
anything: where we actually are, what the previous phase left behind, and what gets cut if time has
slipped. This is the deliberate substitute for writing a plan per phase — it reflects reality at that
moment instead of a prediction made weeks earlier, and it leaves no dead documentation to maintain.

**Phase brief (30 min, written).** Only in **P1** and **P4**, the phases with creative divergence,
where the plan cannot decide for you because the decisions are matters of judgement. Half a page: the
question you want to answer, the constraints, and the criteria you will choose by. Written *before*
opening Claude Design, and a legitimate design artefact for the case study.

**Component phases get no phase plan**: each component's plan is its `.spec.md`. Do not duplicate it.

**The second-time rule.** Skills, hooks and subagents are created the *second* time you do a task by
hand, never the first. Encoding a workflow you have not yet validated is how unused tooling
accumulates. That is why they are spread across the phases rather than front-loaded into a tooling
sprint.

---

## P0 · Foundations and scaffolding — 4/16 · 12 h

> Goal: `0.0.1` on npm, CI green and Pages live **before** a single component is written.

- [x] Phase kickoff (10 min)
- [ ] `git init -b main` + `pnpm init` + public repo created on GitHub
- [x] `pnpm-workspace.yaml` with `packages/*` and `apps/*`
- [ ] Base toolchain installed (typescript, turbo, vitest, eslint, prettier, changesets)
- [ ] `pnpm changeset init`
- [ ] `packages/tokens` with a minimal three-colour JSON
- [ ] `packages/ui` with Vite in library mode + a trivial component + correct `exports`
- [ ] `.github/workflows/ci.yml` — install · lint · typecheck · test · build
- [ ] `main` protected + `pull_request_template.md` + `CODEOWNERS`
- [ ] `0.0.1` versioned with a changeset (tag + GitHub Release) and published to npm
- [ ] GitHub Pages live (source: GitHub Actions) serving a placeholder
- [x] `AGENTS.md` at the root (one screen) + `CLAUDE.md` pointing at it
- [ ] `standards` skill — WCAG 2.2 AA · ARIA APG · DTCG · semver. **Links the source** and translates
      it into checkable rules; never paraphrases the spec from memory
- [x] Hook `review-before-commit` — every `git commit` becomes an approval prompt carrying the
      staged diff, so nothing is ever committed unreviewed
- [ ] Hook `PostToolUse` on `packages/ui/**` running the tests for the edited file
- [ ] ADR `0001-monorepo.md`

**P0 milestone** — [ ] example PR merged with CI green · [ ] `0.0.1` versioned with a CHANGELOG ·
[ ] Pages responds

---

## P1 · Visual system and tokens — 0/12 · 16 h

- [ ] Phase kickoff (10 min)
- [ ] **P1 brief** — what personality the system is after, what constrains it (accessibility, two
      modes, density), and the criteria for choosing between the three directions. Written *before*
      opening Claude Design, so the choice isn't made by visual seduction.
- [ ] Divergence session with Claude Design → three complete visual directions
- [ ] All three directions exported and kept (case study material)
- [ ] Direction chosen + ADR `0002-visual-direction.md` (what was rejected and why)
- [ ] OKLCH colour ramp generated with `culori` (11 steps per family)
- [ ] Spacing, radii, typography and elevation scales
- [ ] Figma: `Primitives` collection (no modes)
- [ ] Figma: `Semantic` collection with `light` / `dark` modes, not a single literal hex
- [ ] Export to DTCG JSON → `packages/tokens/src/` + Style Dictionary emitting css/ts/json
- [ ] **Theming architecture** — scoping via `[data-koala-theme]` (not only `:root`), and the
      themeable axes defined: colour, radii, density, typography → ADR
- [ ] Token tests: AA contrast in both modes · no semantic pointing at a literal · no gaps in the
      scale · **no component referencing a primitive**

**P1 milestone** — [ ] a Figma change reaches `tokens.css` via a PR · [ ] contrast tests green ·
[ ] ADR `0003-token-architecture.md` · [ ] `token-pipeline` skill

---

## P2 · Components I — the method — 0/14 · 20 h

- [ ] Phase kickoff (10 min)

> The eight-step per-component cycle lives in the [plan](./plan.md#p2--components-i--the-method--20-h--weeks-23).
> Rule: if you are writing props before the `.spec.md`, stop.

### Button — 8 h
- [ ] `Button.spec.md` — the contract in prose: states, variants, keyboard, ARIA, edge cases
- [ ] Tests running red (one `describe` per contract section)
- [ ] Minimal implementation → green → refactor
- [ ] `vitest-axe` across every variant and state
- [ ] Stories + changeset + PR merged
- [ ] `component-tdd` and `a11y-audit` skills created out of this cycle
- [ ] `ds-conventions` skill — token naming, props, component anatomy, what counts as breaking.
      **Dictated by you**, not generated: it is eight years of experience, and its *why* goes in ADRs

### TextField — 7 h
- [ ] `TextField.spec.md` with label/help/error specified as one contract
- [ ] Full TDD cycle + axe
- [ ] Stories + changeset + PR merged

### Tabs — 5 h
- [ ] `Tabs.spec.md` + keyboard matrix (roving tabindex)
- [ ] TDD cycle + a Playwright test for real keyboard behaviour
- [ ] ADR: automatic vs manual activation · Stories · PR merged

**P2 milestone** — [ ] three components with contract, tests, green axe and stories · [ ] two skills
working · [ ] `0.2.0` published

---

## P3 · Components II — the expensive ones — 0/13 · 20 h

- [ ] Phase kickoff (10 min)
- [ ] `a11y-reviewer` subagent with a clean context (audits without remembering writing the code)

### Dialog — 7 h
- [ ] `Dialog.spec.md` + research into native `<dialog>`
- [ ] ADR: native `<dialog>` vs a hand-written trap
- [ ] TDD cycle: focus trap, restore, `inert`, Escape, scroll lock without layout shift
- [ ] Playwright: real focus order · Stories · PR merged

### Select / Combobox — 8 h
- [ ] `Select.spec.md` following the APG to the letter
- [ ] TDD cycle: full keyboard, typeahead, `aria-activedescendant`, Floating UI
- [ ] ADR: **when NOT to use this component** and use native `<select>` instead
- [ ] Playwright + mobile behaviour · Stories · PR merged

### Toast — 5 h
- [ ] `Toast.spec.md` + ADR on imperative vs declarative
- [ ] TDD cycle: queue, `role="status"` vs `alert`, pause on hover/focus, `prefers-reduced-motion`,
      WCAG 2.2.1
- [ ] Stories · PR merged

**P3 milestone** — [ ] six complete components · [ ] a documented manual screen reader pass on each ·
[ ] `0.5.0` published

---

## P4 · Documentation — 0/13 · 16 h

- [ ] Phase kickoff (10 min)
- [ ] **P4 brief** — who reads each site and what they need from it (implementer vs decision-maker),
      what questions the home page has to answer, and what will *not* be on the site so that
      Storybook still has a job. Written *before* mocking anything up.
- [ ] Storybook: autodocs with typed props
- [ ] `component-docs` skill with the fixed MDX structure
- [ ] Six MDX files written: Overview · Anatomy · Usage · Do & Don't · Props · A11y · Design decisions
- [ ] Docs site mockups with Claude Design (home, component page, playground)
- [ ] `apps/docs` in Astro, with Vue islands
- [ ] *Foundations* page reading `tokens.json` from the package (no copied hex values)
- [ ] Component gallery with a playground
- [ ] **Second brand theme** (one JSON of semantics) as proof of themeability
- [ ] Live theme switcher + all six components in two brands, side by side
- [ ] *Decisions* section rendering the ADRs + `/process` page carrying the plan
- [ ] Deploy: docs at the Pages root, Storybook at `/storybook`

**P4 milestone** — [ ] both sites live · [ ] colour docs generated from the real tokens

---

## P5 · Visual regression and a real release — 0/10 · 12 h

- [ ] Phase kickoff (10 min)
- [ ] Chromatic connected + baseline of the six components in light and dark
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

## P6 · Dogfooding: portfolio, CV and React port — 0/9 · 16 h

- [ ] Phase kickoff (10 min)
- [ ] `irene-cv` repo with Astro + `pnpm add @koalakanibal/koala` from npm
- [ ] **Friction list** opened and fed as things surface (→ log, below)
- [ ] CV and case study mockups with Claude Design
- [ ] CV built entirely from your own components and tokens
- [ ] Printable version of the CV (`@media print`)
- [ ] Release `1.1.0` fixing what dogfooding surfaced
- [ ] `packages/ui-react`: `Button` and `TextField` reusing the same `.spec.md` and the same CSS
- [ ] React and Vue islands coexisting on the same docs page, identical

**P6 milestone** — [ ] CV published, consuming the npm package · [ ] React port working

---

## P7 · Case study — 0/10 · 12 h

- [ ] Phase kickoff (10 min) — with the whole friction log in front of you
- [ ] 1 · The thesis in one sentence
- [ ] 2 · The constraints
- [ ] 3 · Four decisions with real trade-offs (what was lost by choosing)
- [ ] 4 · The PR that tells everything, with screenshots
- [ ] 5 · The friction — *the section that convinces* (source: the log)
- [ ] 6 · What the AI proposed and what I decided
- [ ] 7 · Evidence in numbers (coverage, axe, bundle, release time, ADR count)
- [ ] 8 · What I left out and what I'd do differently
- [ ] Repo README rewritten: the same story in twenty lines

**P7 milestone** — [ ] case study published · [ ] a post or thread summarising the project

---

## Friction log

> Not an optional diary. Every entry here becomes a sentence in the case study (P7 · section 5).
> Write it **while it is hot**: what broke, what took longer than expected, what changed your mind,
> and what you discovered consuming your own package from outside.
>
> Format: `**YYYY-MM-DD** — what happened → what I changed.`

**2026-08-28** — The plan assumed publishing to npm, which was never in the original brief; it was
inferred rather than decided → registry made an explicit decision with three options and an ADR
planned. Same day, the project goal changed from "portfolio to find work" to "a small base library,
with the CV as one example" → the React port dropped from proof-of-reach to optional exercise, and
multi-brand theming became an architectural constraint from P1.

---

## Decisions that changed from the plan

> When reality contradicts the [plan](./plan.md), edit it **and** note it here. The fact that the
> prospective plan and the retrospective case study do not quite match is exactly what makes them
> interesting.

| Date | Was | Became | Why |
|---|---|---|---|
| 2026-08-28 | Package registry assumed as npm | Explicit decision: npm, with GitHub Packages as an optional second destination | It was scope inferred from "real release process", never actually agreed |
| 2026-08-28 | Goal included "portfolio to find work" | A small base library, reusable elsewhere; the CV is one example of use | Changes the weight of the React port and makes multi-brand theming a day-one constraint |
| 2026-08-28 | Light/dark only | Multi-theme scoped via `[data-koala-theme]` | Light/dark are two modes of one theme; a reusable library needs more |
| 2026-08-28 | Working docs in Spanish | Everything in the repo in English | Public repo; mixed languages weaken it |
