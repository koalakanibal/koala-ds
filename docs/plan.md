# Koala — Build Plan

> A design system that is small and finished.
> Four components, done properly. What this demonstrates is the whole cycle: a colour decision born
> in Figma that reaches production through a contrast test, a focus bug caught by a test before the
> bug existed, a design pass that makes each component feel considered, and a landing page built
> entirely from the system it documents.

| | |
|---|---|
| **System** | Koala · `@koalakanibal/koala` |
| **Commitment** | 14–16 h / week |
| **Duration** | 8 weeks · 8 phases · ≈115 h |
| **Library** | Vue 3 + TypeScript (React port in P6) |
| **Components** | Button · TextField · Tabs · Card |
| **Deliverables** | npm package · Storybook · a landing that is also the docs site |

> **About this document.** This is the *prospective* version of the project, and it is versioned on
> purpose: the `git log` of this file should show how the plan changed when it met reality. Do not
> rewrite it silently — when something diverges, edit it in a commit that explains why. The final
> case study (P7) is the *retrospective* version, and the fact that the two do not quite match is
> exactly what makes them worth reading together.

---

## The thesis, before the code

This goes in the README on day one, because it is what stops the project from being one more
catalogue of buttons:

> *Most public design systems show the result. This one shows the process: every component carries a
> behaviour contract written before its tests and a design pass written after them, every colour
> token has a contrast test that fails if someone breaks it, every decision has an ADR that also
> records what was rejected, and every release is a pull request with visual evidence attached.*

Four practical consequences that shape the whole plan:

- **The pipeline is built before the components.** CI, changesets and a published `0.0.1` all exist
  in Phase 0. A release process left until the end never gets built.
- **Four components done well beat six done correctly.** Correctness is table stakes; craft is the
  differentiator. Every component gets budgeted design time, not just budgeted test time.
- **What we don't build is documented too.** An ADR explaining why there is no `Select` is worth
  more than a `Select`.
- **Accessibility is a failing test, not a review step.** If a branch can merge with axe failing,
  accessibility is not part of the workflow.

---

## Decisions

| Decision | Choice | Why, in one line |
|---|---|---|
| Framework | Vue 3 + TypeScript, React port in P6 | Fluency where it matters; the port *proves* the base is framework-agnostic |
| Styles | CSS Modules + custom properties + `@layer` | Consumers import one stylesheet; runtime theming with no rebuild |
| Tokens | Figma Variables → DTCG JSON → Style Dictionary | The differentiator: almost nobody shows the real bridge |
| Components | Four, each with a design pass | Craft is the point; the fifth is cheap once the method exists |
| Repos | One monorepo. No separate portfolio repo | The landing *is* the docs site; npm consumption is proven by a CI smoke test instead |
| Design work | Human decides, agent propagates | The agent scaffolds Figma and fills matrices; it never makes the visual call |
| Tests | Vitest + Testing Library + vitest-axe + Playwright | jsdom for 80 %, a real browser for focus and keyboard |
| Visual | Chromatic with TurboSnap | A visual diff on every pull request |
| Release | Changesets + GitHub Actions → public npm | Semver reasoned by hand, changelog and tags automated |
| Docs | Storybook (implementers) + one Astro site that is both landing and docs | One deploy, one story, built from the system itself |
| Claude Design | P1 (exploration) and P4 (landing mockups) | Visual divergence and prototyping; never the production CSS |

### A · Framework: Vue now, React at the end

The question was whether to start in React. The honest answer is that not feeling like "a
programmer" **does not come from the framework**: it comes from never having done the full
engineering cycle — tests first, CI, versioning, release. Which is precisely what this project is.
Doing it in Vue means the only new difficulty is the one worth learning. Doing it in React would add
a second learning curve that masks progress, and in practice that is what makes side projects die in
week three.

But "play it safe" would be a poor answer, so the plan does something better: **the token and CSS
layer is framework-agnostic from day one** (custom properties, nothing Vue-specific), and in Phase 6
`Button` and `TextField` are ported to React reusing the same behaviour contracts. That buys three
things: React gets learned with a safety net (the tests already exist), portability is *demonstrated*
rather than claimed, and the case study gains its best chapter — *what broke in the port, and what
it taught me about my own API*.

### B · Styles: CSS Modules + custom properties

The right question is not "which do I like best" but **"what am I imposing on whoever installs this
package"**. That orders the options by itself:

| Option | Cost to the consumer | Verdict |
|---|---|---|
| Tailwind | Requires Tailwind and extending a preset; tokens end up buried in a config | No, not for a distributable library |
| vanilla-extract | Excellent and type-safe, but it is a DSL in TypeScript | No — it removes the very tool this project is strongest in |
| Runtime CSS-in-JS | Runtime weight, SSR friction | No |
| **CSS Modules + custom properties** | One `import "@koalakanibal/koala/styles.css"` | **Yes** |

Two details that turn this from "CSS" into "CSS architecture", and that are direct case study
material:

```css
/* Layers: consumers can override without specificity wars */
@layer koala.reset, koala.tokens, koala.components, koala.overrides;

/* Three token tiers: primitive → semantic → component */
@layer koala.tokens {
  :root {
    --koala-teal-600: oklch(45% 0.06 195);           /* primitive */
    --koala-color-action-bg: var(--koala-teal-600);  /* semantic  */
  }
}
@layer koala.components {
  .button {
    --_bg: var(--koala-button-bg, var(--koala-color-action-bg)); /* component */
    background: var(--_bg);
  }
}
```

That three-tier hierarchy *is* the seniority argument. A junior writes `--blue-500`. A mature system
writes `--color-action-bg` and offers `--koala-button-bg` as a controlled escape hatch.

Three sub-decisions inside this one, which affect `package.json` and the build:

**No preprocessor.** Native CSS: nesting, `@layer`, `color-mix()`, `light-dark()`, custom
properties. Lightning CSS — bundled with Vite — handles browser targets. A design system in 2026 does
not need Sass, and saying so in an ADR is a defensible position.

**How the CSS ships.** A single `styles.css` as the main path
(`import "@koalakanibal/koala/styles.css"`), plus per-component CSS for anyone who wants
granularity. Careful: `sideEffects` must be declared correctly in `package.json` or the consumer's
bundler will tree-shake the styles away — a classic silent failure, and exactly what the P6 smoke
test exists to catch.

**States and variants as `data-*`, not combined class names.**

```css
/* Instead of .button--primary.button--loading */
.root { … }
.root[data-variant="primary"] { … }
.root[data-loading] { … }
```

Three real advantages: they are readable in devtools without decoding CSS Modules hashes; a consumer
can hook onto them from outside without depending on generated class names; and specificity stays
flat. This goes into the `ds-conventions` skill.

### C · One monorepo, and how npm stays honest without a second repo

A monorepo with pnpm workspaces + Turborepo for `tokens`, `ui`, `ui-react`, Storybook and the site:
the token → component → doc cycle breaks the moment it is split across repos (cross versioning,
coordinated PRs, an impossible changelog). Changesets exists for exactly this shape.

An earlier version of this plan put the portfolio in a separate repo, so that installing
`@koalakanibal/koala` from npm would prove the published package actually works. That repo is gone —
the landing and the docs site are now the same Astro app, living here. **But the proof it provided
still matters**, so it is replaced by something cheaper: a CI job that installs the published package
into a clean directory and typechecks a sample import. If an export is missing or `sideEffects` eats
the stylesheet, that job fails. Two hours, same signal, one less repo.

```
koala-ds/                    ← one public monorepo
├─ .changeset/
├─ .claude/
│  ├─ hooks/                 ← review-before-commit, and the test hook
│  └─ skills/                ← skills, versioned
├─ .github/workflows/
├─ docs/
│  ├─ plan.md                ← this file
│  ├─ progress.md            ← the running checklist
│  └─ decisions/             ← ADRs
├─ packages/
│  ├─ tokens/                ← DTCG JSON + Style Dictionary
│  ├─ ui/                    ← Vue 3 + .storybook/
│  ├─ ui-react/              ← P6, two components
│  └─ config/                ← shared tsconfig, eslint
└─ apps/
   └─ site/                  ← Astro: the landing AND the docs
```

### D · Tokens: Claude Design → Figma → JSON → CSS

1. **Divergence with Claude Design.** Three complete visual directions. Keep all three — the
   rejected ones are case study content.
2. **An OKLCH scale** generated programmatically (`culori`), not hand-picked. Perceptually uniform
   lightness and predictable contrast.
3. **Formalised as Figma Variables.** A `Primitives` collection with no modes, a `Semantic`
   collection with `light` / `dark` modes.
4. **Exported to DTCG JSON** (the W3C format) → committed to `packages/tokens/src/`. That commit is
   the design↔code boundary, and it should be visible in the git history.
5. **Style Dictionary** → `tokens.css` (custom properties inside `@layer`), `tokens.ts` (types),
   `tokens.json`.
6. **Tests over the tokens** — the part almost nobody does, and the one that turns the pipeline into
   something demonstrable:

```ts
// packages/tokens/src/contrast.test.ts
it.each(SEMANTIC_PAIRS)('%s meets AA in both modes', (pair) => {
  expect(contrastRatio(pair.fg, pair.bg, 'light')).toBeGreaterThanOrEqual(4.5)
  expect(contrastRatio(pair.fg, pair.bg, 'dark')).toBeGreaterThanOrEqual(4.5)
})

it('no semantic token points at a literal value', () => {
  expect(semanticTokens.every(t => t.value.startsWith('{'))).toBe(true)
})
```

> **The demo that tells the whole story.** A pull request titled *"Raise the contrast of the disabled
> state"* that changes **one** value in Figma, and in which you can see: the JSON diff, the
> regenerated CSS, the contrast test going from red to green, and Chromatic's visual diffs across
> every component. That single PR demonstrates the entire system. Keep it linked from the case study.

### E · Theming: multi-theme from day one, not just light/dark

**Light and dark are two modes of the same theme.** A different brand, a different density,
different radii, different typography is another thing entirely — and it is what makes a library
usable for more than one project. Deciding it in P1 is free; retrofitting it in P5 is expensive.

Three decisions make it possible:

1. **Scoping: themes do not live in `:root`.** A theme applies to *any* container via an attribute,
   and `:root` is only the default case. Without this you cannot show two themes on the same page,
   which is exactly what the landing needs in order to sell the system.

   ```css
   @layer koala.tokens {
     :root, [data-koala-theme="base"]  { --koala-color-action-bg: var(--koala-teal-600); }
     [data-koala-theme="brand-b"]      { --koala-color-action-bg: var(--koala-plum-500); }
   }
   ```

2. **No component ever references a primitive.** Semantic or component tokens only. This is the one
   constraint that makes a system genuinely themeable, and like the no-literals rule it is
   **testable**:

   ```ts
   it('no component CSS references a primitive token', () => {
     expect(findPrimitiveRefsIn('packages/ui/**/*.module.css')).toEqual([])
   })
   ```

3. **A theme is not only colour.** Radii, density (the spacing scale) and typography are themeable
   axes too. Defining them as such in P1 costs the same as defining them loosely.

**The proof is a second brand theme.** It costs one JSON file of semantics, and visually it is the
single best thing on the landing: the same components, two brands, switching live.

### F · The four components, and why these

The criterion is not "the most used" but **"each teaches a different lesson, and every one is used by
the landing"**. Anything that fails the second half is deferred.

| Component | The axis it demonstrates | The hard decision it documents | Hours |
|---|---|---|---|
| **Button** | Rigour in the apparently trivial, and the richest state matrix in the system | `<button>` vs `<a>` by semantics, not appearance; `aria-disabled` vs `disabled`; 24px target size (WCAG 2.2) | 11 |
| **TextField** | Composition and accessible forms | Label, help and error as a single contract: `aria-describedby`, `aria-invalid`, errors announced without relying on colour | 9 |
| **Tabs** | Keyboard and roving tabindex | Automatic vs manual activation: a genuine a11y trade-off with arguments on both sides | 7 |
| **Card** | Token consumption at its purest — surface, radius, elevation, spacing | Composition via slots vs a props API; when a card should and should not be a link | 6 |

**Deferred, not rejected** — and this goes in an ADR, because saying no is the most senior skill
there is:

- **Dialog** — the natural fifth, and the best engineering lesson left (focus trap, `inert`, native
  `<dialog>`). Build it if week 8 has room.
- **Select / Combobox** (8 h) and **Toast** (5 h) — application components. A landing uses neither.
  They are the obvious first additions once the system is alive, and by then they will be cheaper:
  the expensive part is not the sixth component, it is establishing the method, and the method will
  already exist.
- **Table**, **Tooltip**, layout primitives — out of scope, documented as such.

### G · The design pass: where craft gets its hours

An earlier version of this plan budgeted contract, tests, axe, Playwright, stories and PR — all
correctness, not one hour of design. For a design system built by a designer that is backwards, so
the per-component cycle now carries an explicit design pass between the implementation and the
stories.

**What a design pass covers:**

- **The full state matrix** — rest, hover, press, focus-visible, disabled, loading — and how each
  reads as distinct *without* relying on colour alone.
- **Focus treatment.** Not the browser default: a focus style that belongs to Koala and survives on
  both brand themes and both colour modes.
- **Motion.** Durations and easings taken from tokens, never ad hoc, and a `prefers-reduced-motion`
  path that is designed rather than merely disabled.
- **Optical review.** Alignment, vertical rhythm, the gap between the visual box and the touch
  target.
- **The UX decisions that become the Do/Don't section**: which variant when, how an error is
  recovered from, what happens at small widths.

**How the work splits with the agent.** The agent scaffolds and propagates; the human decides. This
line is not ceremony — the case study has a section called *what the AI proposed and what I decided*,
and it only has content if the decisions were actually human.

| The agent does | The human does |
|---|---|
| Figma Variables: collections, modes, references | Proportions, density, rhythm |
| Component scaffolding: frames, variants, component properties | The focus treatment |
| **Propagating** a resolved state across the rest of the matrix | The first canonical state of each component |
| State grids: variants × states × themes × modes | Motion, and how it feels |
| Keeping the Figma library and the code in sync | Optical corrections |

The third row carries most of the value: resolve one primary button in hover by hand, and let the
agent fill the other forty cells.

### H · Testing: three layers, each where it is honest

| Layer | Tools | What it covers |
|---|---|---|
| Behaviour | Vitest + `@testing-library/vue` + `user-event` (jsdom) | The 80 %: roles, states, interaction, the props API |
| Accessibility | `vitest-axe` per variant + `@storybook/addon-a11y` with the test runner over *every* story | Automated violations, in every test and every PR |
| Reality | Playwright (Tabs, and Dialog if it lands) | What jsdom fakes: `:focus-visible`, real focus order, scrolling, the accessibility tree |
| Visual | Chromatic + TurboSnap | Visual regression on every PR, in light and dark |

> **The limit worth saying out loud.** axe catches at most a third of real problems. That is why
> every component also carries a hand-written **keyboard matrix** in its `.spec.md` and a documented
> **screen reader pass**. A case study that acknowledges that limit signals far more maturity than
> one claiming "100 % accessible".

### I · Agent context: four artefacts, four different jobs

They are not interchangeable, and confusing them is the classic mistake. The question that separates
them is **when their cost is paid**:

| Artefact | What it is | When the cost is paid |
|---|---|---|
| `AGENTS.md` + `CLAUDE.md` | **Always-present** context: what the repo is, conventions, commands | Tokens in *every* session → keep it short and non-perishable |
| Skills (`.claude/skills/`) | **On-demand** procedure: how a specific workflow runs | Nothing until invoked → they can be long |
| Subagents (`.claude/agents/`) | A **second opinion uncontaminated** by prior context | A whole fresh context |
| Hooks (`.claude/settings.json`) | Whatever **must not depend on anyone remembering** | Nothing, the harness runs it |

**`AGENTS.md` is canonical, `CLAUDE.md` is a pointer.** One source of truth — and in a public repo it
says something: *this repo is set up for anyone's agent, not just mine*. Short enough that every line
still gets read, and no longer: it is paid in every session. Anything that is procedure rather than
rule belongs in a skill.

**`AGENTS.md` holds the rule; the skill holds the method.** A rule stays in `AGENTS.md` as one
non-negotiable line — what must happen. How it is done, with all the judgement that needs, goes in
the skill. So the two grow in opposite directions: **every time a skill lands, `AGENTS.md` gets
shorter**, because the prose that was standing in for the missing skill becomes a pointer to it.
Nothing moves out before its skill exists — a rule exiled to a skill nobody has written yet is a rule
that has simply been deleted.

**A rule in `AGENTS.md` is a suggestion; a hook is a guarantee — but only if it fires, and only if it
shows enough to act on.** One hook earns its place here:

- `PostToolUse` on `Edit|Write` under `packages/ui/**` → runs the tests related to the edited file.
  This turns "TDD" from an intention into a closed loop.

A `PreToolUse` hook on `git commit` was built and then removed. It carried `git diff --staged --stat`
— file names and line counts — which can be approved as blindly as nothing at all, and it appears
never to have fired in a session. Commit approval stayed as a rule, carried by showing the full diff
in the conversation. The lesson generalises past this repo: **an unverified guarantee is worse than an
honest suggestion**, because it collects trust it has not earned.

**The subagent that actually helps:** an `a11y-reviewer` with a clean context, auditing a component
without remembering having written it. An agent that just implemented `Tabs` is a poor reviewer of
those `Tabs`; one seeing them for the first time finds what the first took for granted.

**External standards and local conventions do not belong in the same place.**

- **Standards** — WCAG 2.2 AA, the [ARIA APG](https://www.w3.org/WAI/ARIA/apg/), the W3C
  [DTCG](https://tr.designtokens.org/) spec, semver. Nobody's opinion: citable documents. These go in
  the `standards` skill, which **links the source and translates it into something checkable**. A
  skill that paraphrases WCAG from memory is worse than no skill: it manufactures false confidence.
- **Local conventions** — token naming, `disabled` vs `isDisabled`, component anatomy, the state
  matrix every component must define, motion durations, what counts as breaking in *this* system.
  These are decisions, not norms. They go in `ds-conventions` and `ui-craft`, and their *why* goes in
  the ADRs. Dictated from experience, not generated — and written fresh for this repo rather than
  ported from any employer's internal material.

Mixing them is what a senior reviewer spots immediately: an "industry best practices" skill that is
really personal preference dressed as standard. Kept apart, both improve.

**The rule that prevents over-tooling:** *every artefact is created the second time you do the task
by hand, never the first.*

### J · Claude Design, AI for colour, and human judgement above both

**Claude Design enters at two moments**, both visual divergence, neither production:

- **P1 — visual system exploration.** Where it pays off most: three complete directions
  (personality, palette, type scale, radii, density) to have something to react against. Choosing is
  easier than inventing from nothing.
- **P4 — landing mockups.** Hero, section rhythm, the long scroll. Hard to compose from scratch.

Where it does **not** belong: the library's production CSS, the final tokens, the design pass, and
any accessibility decision.

**For colour**: generate the scale with `culori` in OKLCH inside the pipeline itself (reproducible
and testable), and validate with [Adobe Leonardo](https://leonardocolor.io/) or
[APCA](https://www.myndex.com/APCA/). The AI proposes; the contrast test decides.

**How human judgement is documented**: short ADRs in `docs/decisions/` in the form *Context · Options
· Decision · Consequences*. And in the case study, a section with screenshots titled **"What the AI
proposed and what I decided"**.

---

## Where this practises the Unlearn workflows

The process below is not invented from scratch: it is this project used as the exercise for the
*Core Developer Workflows with AI* course. Workflow titles are listed for mapping only — none of the
course's own material is reproduced in this repository.

| Workflow | Where it lands here |
|---|---|
| 01 · Spec a Product Before AI Builds It | This document, plus the "poke holes" pass that opens every phase |
| 02 · Design a Feature AI Can Execute Without Guessing | `Component.spec.md` — the prose contract before any test |
| 03 · Build Features with an AI Agent | The per-component cycle, `AGENTS.md`, the hooks, one branch per unit of value |
| 04 · Reviewing AI-Written Code | The PR workflow, the test-quality review, the adversarial pass, the `a11y-reviewer` subagent |
| 05 · Merging and Deploying | P5 in full: changesets, release workflow, tags, Releases, Pages |
| 06 · Debugging and Performance | P6, on the first real bugs the npm smoke test surfaces, plus the bundle budget in CI |

**Deliberately not applied**, which is itself an instance of *choosing what's out of scope*: feature
flags and dark launches (a component library has no runtime to toggle) and production monitoring and
alerting (a static site and an npm package have no production to watch).

---

## The eight phases

Every phase ends in a verifiable milestone. If the milestone is not met, do not move on: cut the
scope of the current phase instead.

### P0 · Foundations and scaffolding — 12 h · Week 1

**Goal:** a `0.0.1` package on npm, CI green and Pages serving something — *before* a single
component is written. This inversion of order is the most important structural decision in the plan.

**1 · Repo and workspace.** `git init`, `pnpm init`, `pnpm-workspace.yaml`, public repo on GitHub.

**2 · Base toolchain**

```bash
pnpm add -Dw typescript turbo vitest @vitest/coverage-v8 eslint prettier @changesets/cli
pnpm changeset init
```

**3 · The first two packages.** `packages/tokens` (a JSON with three colours for now) and
`packages/ui` (Vue + Vite in library mode, with a trivial component that exists only so the pipeline
has something to publish). Configure `exports` in `package.json` properly from the start — that is
what the P6 smoke test validates later.

**4 · Minimal CI.** `.github/workflows/ci.yml`: install → lint → typecheck → test → build.

```yaml
on: pull_request
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint typecheck test build
```

**5 · Repo governance.** Protect `main` (no direct pushes, CI required before merging). Add
`.github/pull_request_template.md` with *What · Why · How to test · A11y checklist · Changeset
included?*, and a `CODEOWNERS`.

**6 · First release, first deploy.** A changeset, `0.0.1`, `pnpm publish -r --access public`. Enable
GitHub Pages with *source: GitHub Actions* and deploy a placeholder. What matters is that the path is
open.

**7 · Agent context.** `AGENTS.md` and `CLAUDE.md`, the `standards` skill, the test hook, and
`docs/decisions/0001-monorepo.md` as the first ADR.

> **P0 milestone** — An example PR opened, reviewed and merged with CI green ·
> `@koalakanibal/koala@0.0.1` installable from npm · Pages responding · one ADR written.

---

### P1 · Visual system and tokens — 18 h · Weeks 1–2

**Goal:** three-tier tokens, two modes, two brands, travelling Figma → JSON → CSS, with tests that
fail when contrast breaks. This is the phase the whole project exists to practise.

1. **Brief (1 h).** What personality the system is after, what constrains it, and the criteria you
   will judge the three directions by. Written *before* opening Claude Design, so the choice is not
   made by visual seduction.
2. **Divergence (3 h).** Claude Design: three complete visual directions. Let them rest a day.
   Export and keep all three. Then use them for a second job most people skip: **read the mockups
   against the spec and list what they expose as missing**. A mockup is a gap detector, not just a
   picture — it shows the states, densities and edge cases the written spec forgot.
3. **Convergence and ADR (2 h).** `0002-visual-direction.md`: what was chosen, what was rejected, on
   what grounds. This is where a fine-arts background has to show.
4. **The colour ramp, built to be understood (5 h).** This is the phase the project exists for, so
   it is deliberately not a finished script handed over. Three movements:

   **a · See the problem before the solution.** Generate the same ramp in HSL and in OKLCH and put
   them side by side. In HSL, two colours at the same lightness are not equally light — a yellow at
   50 % dazzles and a blue at 50 % is nearly black, which is why hand-built palettes always have one
   family that misbehaves. In OKLCH lightness is perceptually uniform. This is a visual argument and
   it needs no further explanation once seen.

   **b · One family, line by line.** Build a single colour's ramp with the code explained and the
   output inspected at each step. This is where it becomes clear what `culori` actually does — and
   where its job ends. It is a build-time dependency: it generates `tokens.css` and then disappears.
   What a consumer installs is custom properties, not JavaScript.

   **c · Generalise to the rest**, which is now mechanical.

   Then the other scales: spacing, radii, typography, elevation — and motion durations and easings,
   which the design pass will need.
5. **Figma Variables (3 h).** `Primitives` (no modes) and `Semantic` (`light` / `dark`) whose values
   *always* point at a primitive. The agent builds these; you decide what goes in them.
6. **Export and transform (2 h).** DTCG JSON → Style Dictionary → `tokens.css`, `tokens.ts`,
   `tokens.json`.
7. **ADR `0004-why-oklch.md`, written by hand (1 h).** Why OKLCH over HSL, why this library over
   Color.js or chroma.js, and what it costs. Writing it is what consolidates the understanding, and it
   is the artefact that demonstrates it outward.
8. **Token tests and theming architecture (2 h).** AA contrast in both modes; no semantic with a
   literal; no gaps in the scale; scoping via `[data-koala-theme]`. ADR `0003-token-architecture.md`.

> **P1 milestone** — A change made in Figma reaches `tokens.css` through a PR with green CI · The
> contrast tests pass in light and dark · Two ADRs written · The `token-pipeline` skill created.

---

### P2 · Button and TextField — 22 h · Weeks 2–3

**Goal:** the two foundational components. But what is really built here is the *method*, because the
cycle established with the Button repeats three more times.

**The per-component cycle — eleven steps, one branch, one PR:**

1. **Behaviour contract** in `Button.spec.md`: what it does, states, variants, keyboard matrix,
   expected ARIA, edge cases. In prose, before touching TypeScript.
2. **State the approach.** Before any code, the agent writes a few lines on how it intends to
   build it. Correcting an approach costs a minute; correcting an implementation costs an hour.
3. **Every line of the contract becomes a test.** One `describe` per contract section. It runs red.
4. **Minimal implementation** until green. No "just in case" props.
5. **Refactor** with the tests as a safety net.
6. **Design pass** — the full state matrix, focus treatment, motion, optical review, both themes and
   both modes. Resolve one state by hand; let the agent propagate it across the matrix in Figma.
7. **Review the tests as their own artefact.** Green does not mean good: a test can pass while
   asserting nothing that matters. Read them apart from the implementation, and break the component
   on purpose to confirm something goes red.
8. **vitest-axe** across every variant and state.
9. **Adversarial pass.** Try to break it: overlong content, absurd props, deep nesting, 200 % zoom,
   RTL. Playwright for the keyboard matrix, where the component has one.
10. **Stories** covering every variant (they double as the Chromatic cases), plus one that renders the
   component under the second theme — if something breaks there, a primitive reference has leaked in.
11. **A pull request** with the visual diff attached, a changeset, and a one-line justification
   for any new dependency.

**Time split:** Button (11 h — 8 engineering, 3 design) is deliberately slow: this is where the
`component-tdd`, `a11y-audit`, `ds-conventions` and `ui-craft` skills are born, along with the API
conventions and the state-matrix standard the other three inherit. TextField (9 h — 7 + 2) is the
composition pattern and accessible error UX.

> **The classic mistake in this phase:** starting to design the API in the editor. If you catch
> yourself writing props before the `.spec.md`, stop. The prose contract takes thirty minutes and
> saves two refactors.

> **P2 milestone** — Two components with contract, tests, design pass, green axe and stories · Two
> PRs merged with visual evidence · Four skills working · `0.2.0` published.

---

### P3 · Tabs and Card — 13 h · Weeks 3–4

**Goal:** the two components that complete the set, at the same standard and in less time — because
by now the method exists.

**Tabs (7 h — 5 engineering, 2 design).** Roving tabindex, `aria-controls`, orientation, and the ADR
on automatic vs manual activation, which is a genuine a11y trade-off rather than a preference. The
design pass here is mostly about the selected indicator and its motion.

**Card (6 h — 4 engineering, 2 design).** The purest token consumer in the system: surface,
elevation, radius, spacing, and how all four shift between brands. Composition via slots rather than
a props API, and the ADR on when a card should — and should not — be a link. This is the component
the landing leans on hardest.

> **P3 milestone** — Four complete components · A documented manual screen reader pass on each ·
> `0.5.0` · Two more ADRs.

---

### P4 · Storybook and the site — 20 h · Weeks 4–5

**Goal:** Storybook for implementers, and one Astro site that is simultaneously the landing and the
documentation. Same source of truth, two registers, one deploy.

**Storybook (7 h).** Autodocs with typed props, plus one MDX per component following the fixed
structure the `component-docs` skill enforces: *Overview · Anatomy · Usage · Do & Don't · Props ·
Accessibility · Design decisions*. *Design decisions* links to the ADR, making the decision tree
navigable straight from the docs.

**The site (13 h).** Astro because it is content-first, supports Vue islands (and later React ones),
builds static output for Pages, and lets you write real HTML and CSS.

```
/                → the landing: hero, what Koala is, live demos, brand switcher
/foundations     → colour, typography, spacing — read live from tokens.json
/components/*    → gallery with a playground
/decisions       → the ADRs, rendered
/storybook       → Storybook
```

Mock up the landing with Claude Design first. The landing is not a marketing exercise: it is the
proof that the system can build something real, and the brand switcher on the home page is the single
most persuasive thing the project produces.

> **What stops this from being one more docs site:** the colour examples are painted by reading
> `tokens.json` from the package, not from copied hex values. When a token changes, the docs change
> on their own.

> **P4 milestone** — Site live at the Pages root, Storybook at `/storybook` · Four MDX files with the
> same structure · The `component-docs` skill created · Colour docs generated from the real tokens ·
> The brand switcher working on the landing.

---

### P5 · Visual regression and a real release — 12 h · Week 5

**Goal:** Chromatic required on every PR, and a `1.0.0` published with an automatic changelog and a
written versioning policy.

1. **Chromatic (4 h).** Connect the project, upload the baseline for all four components in both
   modes, enable **TurboSnap** and make the check required for merging. Then deliberately provoke a
   token change and approve the diff — that screenshot goes into the case study.

   > **Watch the snapshot multiplication.** Variants × modes × themes grows fast, and Chromatic's
   > free plan has a monthly cap. Snapshot *every* variant in the base theme across light and dark,
   > and only a handful of representative stories in the second theme. If that still overruns,
   > document the trimming criteria — a real maintenance decision.

2. **Versioning policy (3 h).** `docs/versioning.md`: what counts as breaking in a design system. The
   answer is not obvious — *is changing a colour token minor or major? What about changing a
   component's internal DOM when someone was styling it from outside?* Having a written position on
   that is what eight years of real maintenance sounds like.
3. **Automated release (3 h).** `release.yml` with the Changesets action: merging to `main` opens a
   *"Version Packages"* PR; merging that publishes to npm, creates the tag and the GitHub Release.
4. **The `1.0.0` (2 h).** With a hand-written major changeset explaining the stability commitment
   being made. That text is content, not paperwork.

> **P5 milestone** — `1.0.0` on npm with CHANGELOG and Release · Chromatic blocking PRs · Versioning
> policy published · The `release-check` skill created.

---

### P6 · The React port, the smoke test, and the first real bug — 8 h · Week 6

**Goal:** prove the two claims the project has been making — that the styling layer is
framework-agnostic, and that the published package actually works.

1. **The npm smoke test (2 h).** A CI job that installs `@koalakanibal/koala` from the registry into
   a clean directory and typechecks a sample import. This is what the separate portfolio repo used to
   do. **Record every friction it surfaces** — a missing export, an unresolved type, a token that is
   not exposed, `sideEffects` eating the stylesheet. That list is gold for the case study, and it
   produces a `1.1.0` fixing them.

   **These are the project's first genuine production bugs, so they get the full debugging
   treatment** rather than a quick patch: reproduce it as a failing test first, fix the cause rather
   than the symptom, and leave the test behind as a regression guard so it cannot return. A bug found
   and fixed without a test is a bug you will meet twice.

2. **The React port (6 h).** `packages/ui-react`: `Button` and `TextField` in React, reusing **the
   same `.spec.md` and the same test cases**, and the same CSS untouched. Mount them as React islands
   on the site, coexisting with the Vue islands on the same page. Two frameworks, one styling system,
   pixel for pixel identical — that is the definitive visual proof.

> **P6 milestone** — Smoke test green in CI · Release `1.1.0` fixing what it surfaced · Two React
> components living alongside the Vue ones on the site.

---

### P7 · The case study — 10 h · Weeks 6–7

**Goal:** turn the work into a story that reads in ten minutes and is remembered.

A list of components gets skimmed. A story with conflict gets read. This structure has conflict:

1. **The thesis** — one sentence. *"Design systems don't fail because of their components; they fail
   because of their process."*
2. **The constraints** — eight weeks, one person, a deliberately small scope. Constraints give
   decisions their credibility.
3. **Four decisions with real trade-offs**, three paragraphs each: what the options were, what was
   chosen, what was lost. Candidates: the three-tier token architecture; four components instead of
   six; CSS Modules over Tailwind; deferring Select and Toast.
4. **The PR that tells everything** — the token change travelling through Figma, JSON, CSS, the
   contrast test and every visual diff. With screenshots.
5. **The friction** — what broke. The smoke test that revealed forgotten exports. The React port that
   exposed a coupling you did not know you had. *This is the section that convinces.* A case study
   without friction reads like marketing.
6. **What the AI proposed and what I decided** — the three Claude Design directions, the chosen one,
   the changes made and why. And the design pass: what the agent propagated versus what you resolved.
7. **Evidence** — coverage, axe violations found and fixed, bundle size, release time, ADR count.
   Numbers, not adjectives.
8. **What I left out and what I'd do differently** — close honestly.

> **P7 milestone** — Case study published on the site · Repo README rewritten so the GitHub landing
> tells the same story in twenty lines.

---

## The pull request workflow, working solo

Working alone does not mean skipping the process: it means the process is carried by CI and a
structured self-review.

1. **One branch per unit of value.** `feat/button-tdd`, `feat/tokens-color-scale`,
   `chore/chromatic-setup`. If a branch touches two components, it is two branches.
2. **Conventional Commits** — they feed the changelog, and the history reads as a record of how you
   think. Agent-assisted commits carry a `Co-Authored-By` trailer; solo commits do not.
3. **Before opening the PR**, run `/code-review` over the branch and resolve what comes up.
4. **PR from the template**: What · Why · How to test · A11y checklist · Changeset · Chromatic link.
5. **CI is required**: lint, typecheck, tests, axe over every story, build and Chromatic. No
   exceptions, no bypass.
6. **A documented self-review.** GitHub does not let you approve your own PR — which is an
   opportunity: leave a *self-review* comment noting what you were unsure about and how you resolved
   it. An external reader finds your reasoning where they would look for it.
7. **Squash merge** with a conventional-commit title.
8. **The release PR** is opened by Changesets itself. That one gets read in full before merging.

---

## Schedule

| Week | Phase | Hours | By the end, this exists |
|---|---|---|---|
| 1 | P0 + start of P1 | 15 | `0.0.1` on npm, CI green, Pages live |
| 2 | End of P1 + start of P2 | 16 | Tokens travelling Figma → CSS, with tests |
| 3 | End of P2 + start of P3 | 16 | Button and TextField · `0.2.0` |
| 4 | End of P3 + start of P4 | 16 | All four components · `0.5.0` |
| 5 | End of P4 + P5 | 16 | Site, Storybook, Chromatic · `1.0.0` |
| 6 | P6 + start of P7 | 14 | React port, smoke test, first debugged bug · `1.1.0` |
| 7 | End of P7 | 12 | Case study and final README |
| 8 | Buffer | 10 | Dialog as a fifth component, or slack |

**Total ≈ 115 h across 7 working weeks, with week 8 as buffer.** The buffer is not optional padding:
every project of this shape overruns somewhere, and having the overrun planned is what stops it from
becoming abandonment. If nothing overruns, week 8 buys `Dialog`.

If time runs short, the first thing to cut is the React port in P6 — not the case study, which is
what makes everything else legible.

---

## Rules of the game

The five things that make an eight-week project finish in week eight rather than in limbo.

- **Nothing merges with axe failing.** No exceptions, no "I'll fix it later". It is the only rule
  that guarantees accessibility is built in rather than painted on.
- **No PR without a changeset**, documentation PRs included. The version history should read as a
  narrative.
- **No non-trivial decision without an ADR**, written *before* implementing, not afterwards as
  justification.
- **The time-box outranks the scope.** If Tabs eats ten hours, Tabs gets simplified and the reason
  gets documented. Cutting scope with judgement is also something the case study teaches.
- **At least one commit a day**, however small. Continuity avoids the cost of reloading context.

---

*Plan v2 · Vue 3 · pnpm + Turborepo · Figma Variables → Style Dictionary · Vitest + Playwright +
Chromatic · Changesets · npm · GitHub Pages*
