# Koala — Build Plan

> A design system that is small and complete.
> Six components impress nobody. What this demonstrates is the whole cycle: a colour decision born
> in Figma that reaches production through a contrast test, a focus bug caught by a test before the
> bug existed, and a `1.0.0` shipped with an automatic changelog.

| | |
|---|---|
| **System** | Koala · `@koalakanibal/koala` |
| **Commitment** | 14–16 h / week |
| **Duration** | 7 weeks · 8 phases |
| **Library** | Vue 3 + TypeScript (React port in P6) |
| **Deliverables** | npm package · Storybook · Docs site · CV |

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
> behaviour contract written before its tests, every colour token has a contrast test that fails if
> someone breaks it, every decision has an ADR that also records what was rejected, and every
> release is a pull request with visual evidence attached.*

Three practical consequences that shape the whole plan:

- **The pipeline is built before the components.** CI, changesets and a published `0.0.1` all exist
  in Phase 0. A release process left until the end never gets built.
- **What we don't build is documented too.** An ADR explaining why there is no `Card` is worth more
  than a `Card`.
- **Accessibility is a failing test, not a review step.** If a branch can merge with axe failing,
  accessibility is not part of the workflow.

---

## Decisions

| Decision | Choice | Why, in one line |
|---|---|---|
| Framework | Vue 3 + TypeScript, React port in P6 | Fluency where it matters; the port *proves* the base is framework-agnostic |
| Styles | CSS Modules + custom properties + `@layer` | Consumers import one stylesheet; runtime theming with no rebuild |
| Tokens | Figma Variables → DTCG JSON → Style Dictionary | The differentiator: almost nobody shows the real bridge |
| Repos | Monorepo (pnpm + Turborepo), portfolio separate | The portfolio installs from npm like a stranger would — that *is* the dogfooding |
| Tests | Vitest + Testing Library + vitest-axe + Playwright | jsdom for 80 %, a real browser for focus and keyboard |
| Visual | Chromatic with TurboSnap | A visual diff on every pull request |
| Release | Changesets + GitHub Actions | Semver reasoned by hand, changelog and tags automated |
| Registry | Public npm (+ optional GitHub Packages in P5) | Installable without friction; GitHub Packages needs auth even for public packages |
| Docs | Storybook (implementers) + Astro (everyone else) | Two audiences, two registers, one source of truth |
| Claude Design | P1 (exploration) and P4/P6 (mockups) | Visual divergence and prototyping; never the production CSS |

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

> **If React were preferred anyway:** little changes. Swap `@testing-library/vue` for
> `@testing-library/react`, `Teleport` for `createPortal`, and in P3 lean on
> [React Aria](https://react-spectrum.adobe.com/react-aria/) for `Select` and `Dialog`. The eight
> phases, the milestones and the time-boxing are identical.

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

Three sub-decisions inside this one, which affect `package.json` and the build and are worth settling
in P0:

**No preprocessor.** Native CSS: nesting, `@layer`, `color-mix()`, `light-dark()`, custom
properties. Lightning CSS — bundled with Vite — handles browser targets. A design system in 2026 does
not need Sass, and saying so in an ADR is a defensible position.

**How the CSS ships.** A single `styles.css` as the main path
(`import "@koalakanibal/koala/styles.css"`), plus per-component CSS for anyone who wants
granularity. Careful: `sideEffects` must be declared correctly in `package.json` or the consumer's
bundler will tree-shake the styles away — a classic silent failure, and one of the kind that surfaces
in P6.

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

### C · Monorepo for the system, separate repo for the portfolio

A monorepo with pnpm workspaces + Turborepo for `tokens`, `ui`, `ui-react`, Storybook and the docs
site: the token → component → doc cycle breaks the moment it is split across four repos (cross
versioning, coordinated PRs, an impossible changelog). Changesets exists for exactly this shape.

**The portfolio lives in a separate repo**, and not for convenience: by installing
`@koalakanibal/koala` from npm like any third party, the portfolio becomes proof that the published
package actually works. If the CV build breaks because a type was never exported, that is a real
signal a monorepo would have hidden.

```
koala-ds/                    ← monorepo, public
├─ .changeset/
├─ .claude/skills/           ← skills, versioned
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
   └─ docs/                  ← Astro

irene-cv/                    ← separate repo: installs from npm
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
> regenerated CSS, the contrast test going from red to green, and Chromatic's visual diffs across all
> six components. That single PR demonstrates the entire system. Keep it linked from the case study.

### E · Theming: multi-theme from day one, not just light/dark

**Light and dark are two modes of the same theme.** A different brand, a different density,
different radii, different typography is another thing entirely — and it is what makes a library
usable for more than one project. Deciding it in P1 is free; retrofitting it in P5 is expensive,
because it means auditing every component.

Three decisions make it possible:

1. **Scoping: themes do not live in `:root`.** A theme applies to *any* container via an attribute,
   and `:root` is only the default case. Without this you cannot show two themes on the same page,
   which is exactly what the docs site needs.

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

**The proof is a second brand theme**, on the same logic as the React port — themeability is not
claimed, it is demonstrated. It costs one JSON file of semantics, and visually it is among the best
things the project produces: all six components, two brands, side by side on the docs site.

### F · The six components, and why these

The criterion is not "the most used" but **"no two teach the same lesson"**. Each covers a different
axis of the craft.

| Component | The axis it demonstrates | The hard decision it documents |
|---|---|---|
| **Button** | Rigour in the apparently trivial | `<button>` vs `<a>` by semantics, not by appearance; `aria-disabled` vs `disabled`; 24px target size (WCAG 2.2) |
| **TextField** | Composition and accessible forms | Label, help and error as a single contract: `aria-describedby`, `aria-invalid`, errors announced without relying on colour |
| **Tabs** | Keyboard and roving tabindex | Automatic vs manual activation: a genuine a11y trade-off with arguments on both sides |
| **Dialog** | Focus management — where most systems fail | Focus trap and restore, `inert`, scroll lock… and whether native `<dialog>` already solves it |
| **Select / Combobox** | Complex ARIA APG, and the judgement *not* to reinvent | When a custom control is not justified over native `<select>`; typeahead; behaviour on mobile |
| **Toast** | System architecture, not component design | Imperative vs declarative API; `role="status"` vs `role="alert"`; WCAG 2.2.1 (enough time); `prefers-reduced-motion` |

**Deliberately left out** — and this goes in an ADR, because saying no is the most senior skill
there is: `Card` (teaches nothing that TextField's composition doesn't), `Table` (enormous cost, a
duplicate of the Select lesson), `Tooltip` (the best candidate for a seventh if time allows —
criterion 1.4.13 is rich), and any layout primitive like `Stack` (solved with utility classes over
the spacing tokens).

### G · Testing: three layers, each where it is honest

| Layer | Tools | What it covers |
|---|---|---|
| Behaviour | Vitest + `@testing-library/vue` + `user-event` (jsdom) | The 80 %: roles, states, interaction, the props API |
| Accessibility | `vitest-axe` per variant + `@storybook/addon-a11y` with the test runner over *every* story | Automated violations, in every test and every PR |
| Reality | Playwright (Dialog, Select, Tabs, Toast) | What jsdom fakes: `:focus-visible`, real focus order, scrolling, the accessibility tree |
| Visual | Chromatic + TurboSnap | Visual regression on every PR, in light and dark |

> **The limit worth saying out loud.** axe catches at most a third of real problems. That is why
> every component also carries a hand-written **keyboard matrix** in its `.spec.md` and a documented
> **screen reader pass**. A case study that acknowledges that limit signals far more maturity than
> one claiming "100 % accessible".

### H · Registry: how it was decided

The original brief asked for *"semantic versioning, automatic changelog, CI/CD with GitHub Actions,
publishing to GitHub Pages"*. Publishing to a **package registry** was not in it: that is a scope
extension, and it deserves a deliberate decision rather than being inherited from a plan.

| | What changes | Cost |
|---|---|---|
| **A · Public npm** | Anyone installs with `pnpm add`. P6 works as designed: the CV consumes the package from outside, as a third party | A free account, a CI token, a public name committed to |
| **B · No registry** | Changesets still provides semver, changelog, tags and GitHub Releases. The CV consumes via a git URL or from the workspace | P6 loses its strongest argument; the portfolio says *"clone it"* instead of *"install it"* |
| **C · GitHub Packages** | GitHub's own registry, no npm account | Worse as a public shop window: installing requires configuring authentication |

**Decided: A**, because of P6 — discovering a forgotten export only happens when the package is
genuinely installed from outside.

**With C as an optional experiment in P5.** The initial instinct was C (everything on GitHub, one
account), and it is a reasonable one; what rules it out as the primary destination is that **GitHub
Packages requires authentication to install even a public package** — anyone wanting to try the
library would have to generate a token and configure an `.npmrc` first. For an internal company
registry that is irrelevant; for a public shop window it is pure friction.

They are not mutually exclusive, though: adding C as a second destination in P5 costs one `.npmrc`
and one extra workflow step, and it allows writing the comparison ADR **with real experience of
both** rather than having chosen blind. That ADR is worth more than the decision itself.

### I · Agent context: four artefacts, four different jobs

They are not interchangeable, and confusing them is the classic mistake. The question that separates
them is **when their cost is paid**:

| Artefact | What it is | When the cost is paid |
|---|---|---|
| `AGENTS.md` + `CLAUDE.md` | **Always-present** context: what the repo is, conventions, commands | Tokens in *every* session → keep it short and non-perishable |
| Skills (`.claude/skills/`) | **On-demand** procedure: how a specific workflow runs | Nothing until invoked → they can be long |
| Subagents (`.claude/agents/`) | A **second opinion uncontaminated** by prior context | A whole fresh context |
| Hooks (`.claude/settings.json`) | Whatever **must not depend on anyone remembering** | Nothing, the harness runs it |

**`AGENTS.md` is canonical, `CLAUDE.md` is a pointer.** The real content lives in `AGENTS.md` (a
cross-tool convention) and `CLAUDE.md` is a single line importing it (`@AGENTS.md`) or a symlink. One
source of truth — and in a public repo it says something: *this repo is set up for anyone's agent,
not just mine*. Contents: stack, commands, token naming, component anatomy, PR criteria. One screen
maximum — anything longer belongs in a skill.

**A rule in `AGENTS.md` is a suggestion; a hook is a guarantee.** Anything that must *always* happen
belongs in a hook, not in prose. Two that earn their place here:

- `PostToolUse` on `Edit|Write` under `packages/ui/**` → run the tests related to the edited file.
  This turns "TDD" from an intention into a closed loop.
- `PreToolUse` on `git commit` → warn when a commit touches `packages/**` with no changeset.

**The subagent that actually helps:** an `a11y-reviewer` with a clean context, auditing a component
without remembering having written it. An agent that just implemented the `Dialog` is a poor reviewer
of that `Dialog`; one seeing it for the first time finds what the first took for granted. Created in
P3, with the expensive components.

**External standards and local conventions do not belong in the same place.** This is the
distinction that decides whether this layer is useful or decorative:

- **Standards** — WCAG 2.2 AA, the [ARIA APG](https://www.w3.org/WAI/ARIA/apg/), the W3C
  [DTCG](https://tr.designtokens.org/) spec, semver. Nobody's opinion: citable documents. These go
  in the `standards` skill, which **links the source and translates it into something checkable**
  (*"is the error announced without relying on colour? → test"*). A skill that paraphrases WCAG from
  memory is worse than no skill: it manufactures false confidence. This is the exception to the
  second-time rule — it can be written on day one, because it does not depend on experience gained
  in the project.
- **Local conventions** — token naming, `disabled` vs `isDisabled`, component anatomy, what counts
  as breaking in *this* system. These are decisions, not norms. They go in the `ds-conventions` skill
  (born in P2, with the Button, which is where they are actually decided) and their *why* goes in the
  ADRs. Dictated from experience, not generated: eight years of maintaining a system in production is
  the thing a public repo cannot fake.

Mixing them is what a senior reviewer spots immediately: an "industry best practices" skill that is
really personal preference dressed as standard. Kept apart, both improve — the standards gain
authority, and the conventions gain an argument.

**The rule that prevents over-tooling:** *every artefact is created the second time you do the task
by hand, never the first.* Writing the `component-tdd` skill before having done the Button cycle
means encoding a workflow you have not yet validated. That is why the plan places them at the moment
they are born, rather than in an upfront tooling sprint.

All of this lives in the public repo and is a deliverable in itself: it is the documented answer to
*"how do you work with AI?"*.

### J · Claude Design, AI for colour, and human judgement above both

**Claude Design enters at three moments**, all of them visual divergence, none of them production:

- **P1 — visual system exploration.** Where it pays off most: three complete directions
  (personality, palette, type scale, radii, density) to have something to react against. Choosing is
  easier than inventing from nothing.
- **P4 — docs site mockups.** Home, component page, playground.
- **P6 — CV and case study layouts.** Especially the long case study view, which is hard to compose.

Where it does **not** belong: the library's production CSS, the final tokens, and any accessibility
decision.

**For colour**: generate the scale with `culori` in OKLCH inside the pipeline itself (reproducible
and testable), and validate with [Adobe Leonardo](https://leonardocolor.io/) or
[APCA](https://www.myndex.com/APCA/). The AI proposes; the contrast test decides.

**How human judgement is documented**: short ADRs in `docs/decisions/` in the form *Context · Options
· Decision · Consequences*. And in the case study, a section with screenshots titled **"What the AI
proposed and what I decided"**: the three Claude Design directions, the chosen one, and the three
changes made to it with their reasons.

---

## The eight phases

Every phase ends in a verifiable milestone. If the milestone is not met, do not move on: cut the
scope of the current phase instead.

### P0 · Foundations and scaffolding — 12 h · Week 1

**Goal:** a `0.0.1` package installable from npm, CI green and Pages serving something — *before* a
single component is written. This inversion of order is the most important structural decision in the
plan.

**1 · Repo and workspace**

```bash
cd ~/WebstormProjects/MyDS   # this directory is already the repo root
git init -b main
pnpm init
gh repo create koala-ds --public --source=. --remote=origin
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

**2 · Base toolchain**

```bash
pnpm add -Dw typescript turbo vitest @vitest/coverage-v8 eslint prettier @changesets/cli
pnpm changeset init
```

**3 · The first two packages.** `packages/tokens` (a JSON with three colours for now) and
`packages/ui` (Vue + Vite in library mode, with a trivial component that exists only so the pipeline
has something to publish). Configure `exports` in `package.json` properly from the start — that is
what the portfolio validates later.

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

**6 · First release, first deploy**

```bash
pnpm changeset            # describe the change
pnpm changeset version    # 0.0.1 + CHANGELOG
pnpm publish -r --access public
```

Enable GitHub Pages with *source: GitHub Actions* and deploy a placeholder `index.html`. Yes, a
placeholder: what matters is that the path is open.

**7 · Agent context.** `AGENTS.md` at the root (one screen: stack, commands, token naming, component
anatomy, PR criteria) and `CLAUDE.md` as a pointer. The first hook in `.claude/settings.json`:
`PostToolUse` on `Edit|Write` under `packages/ui/**`, running the related tests. And
`docs/decisions/0001-monorepo.md` as the first ADR.

> **P0 milestone** — An example PR opened, reviewed and merged with CI green ·
> `@koalakanibal/koala@0.0.1` installable from npm · Pages responding · one ADR written.

---

### P1 · Visual system and tokens — 16 h · Weeks 1–2

**Goal:** three-tier tokens, two modes, travelling Figma → JSON → CSS, with tests that fail when
contrast breaks.

1. **Divergence (3 h).** A session with Claude Design: three complete visual directions. Do not
   choose while still warm — let them rest a day. Export and keep all three.
2. **Convergence and ADR (2 h).** `0002-visual-direction.md`: what was chosen, what was rejected, and
   on what grounds. This is where a fine-arts background has to show — talk about personality, about
   references, about why that type scale and not another.
3. **Programmatic scales (3 h).** The colour ramp in OKLCH with `culori`: 11 steps per family,
   uniform lightness. Spacing, radii, typography and elevation scales. All derived from rules, not
   from case-by-case taste.
4. **Figma Variables (3 h).** A `Primitives` collection (no modes) and a `Semantic` collection
   (`light` / `dark` modes) whose values *always* point at a primitive, never at a hex.
5. **Export and transform (3 h).**

   ```bash
   # Figma → DTCG JSON → packages/tokens/src/
   pnpm --filter tokens build
   # → dist/tokens.css   custom properties inside @layer koala.tokens
   # → dist/tokens.ts    types + constants
   # → dist/tokens.json  for external consumption
   ```

6. **Token tests (2 h).** AA contrast for every semantic pair in both modes; no semantic token with a
   literal; no gaps in the spacing scale. Plus ADR `0003-token-architecture.md`.

> **P1 milestone** — A change made in Figma reaches `tokens.css` through a PR with green CI · The
> contrast tests pass in light and dark · Two ADRs written · The `token-pipeline` skill created.

---

### P2 · Components I — the method — 20 h · Weeks 2–3

**Goal:** Button, TextField and Tabs. But what is really built here is the *method*, because the
cycle established with the Button repeats five more times.

**The per-component cycle — eight steps, one branch, one PR:**

1. **Behaviour contract** in `Button.spec.md`: what it does, states, variants, keyboard matrix,
   expected ARIA, edge cases. In prose, before touching TypeScript. *This step is the heart of the
   project* and what separates it from any other component repo.
2. **Every line of the contract becomes a test.** One `describe` per contract section. It runs red.
3. **Minimal implementation** until green. No "just in case" props.
4. **Refactor** with the tests as a safety net.
5. **vitest-axe** across every variant and state.
6. **Playwright** for the keyboard matrix, where the component has one.
7. **Stories** covering every variant (they double as the Chromatic cases), plus one that renders the
   component under a second theme — if something breaks there, a primitive reference has leaked in.
8. **A pull request** with the visual diff attached and a changeset.

**Time split:** Button (8 h) — deliberately slow: this is where the `component-tdd` and `a11y-audit`
skills are born, along with the API conventions. TextField (7 h) — the composition pattern and
accessible errors. Tabs (5 h) — roving tabindex and the ADR on automatic vs manual activation.

> **The classic mistake in this phase:** starting to design the API in the editor. If you catch
> yourself writing props before the `.spec.md`, stop. The prose contract takes thirty minutes and
> saves two refactors.

> **P2 milestone** — Three components with contract, tests, green axe and stories · Three PRs merged
> with visual evidence · Two skills working · `0.2.0` published.

---

### P3 · Components II — the expensive ones — 20 h · Weeks 3–4

**Goal:** Dialog, Select and Toast. This is where the project shows real depth: these are the three
places most systems get wrong.

**Dialog (7 h).** Focus trap and restore on close, `inert` on the background, Escape, scroll lock
without layout shift, `Teleport`. The interesting ADR: *does native `<dialog>` already solve enough
of this to avoid hand-writing the trap?* Investigate, decide, and document the reasoning — whatever
the answer turns out to be.

**Select / Combobox (8 h).** Follow the
[APG](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) to the letter. Full keyboard support,
typeahead, `aria-activedescendant`, positioning with Floating UI, behaviour on mobile. The most
valuable ADR in the project: *when you should NOT use this component and should use native
`<select>` instead*. Writing that in a component's own documentation is the most senior signal in the
whole repo.

**Toast (5 h).** Provider plus an imperative API (`toast.success()`), a bounded queue,
`role="status"` vs `role="alert"` by severity, pause on hover and focus, respect for
`prefers-reduced-motion`, and compliance with WCAG 2.2.1 (enough time). An ADR on imperative vs
declarative.

> **P3 milestone** — Six complete components · Playwright tests covering real focus and keyboard · A
> documented manual screen reader pass per component · `0.5.0` · Three more ADRs.

---

### P4 · Documentation for two audiences — 16 h · Weeks 4–5

**Goal:** Storybook for implementers, an Astro site for everyone else. Same source of truth, two
different registers.

**Storybook (7 h).** Autodocs with typed props, plus one MDX per component following the fixed
structure the `component-docs` skill enforces: *Overview · Anatomy · Usage · Do & Don't · Props ·
Accessibility · Design decisions*. The *Design decisions* section links to the ADR, which makes the
decision tree navigable straight from the docs.

**Astro docs site (9 h).** Astro because it is content-first, supports Vue islands (and later React
ones), builds static output for Pages, and lets you write real HTML and CSS. Pages: a home carrying
the thesis, *Foundations* (colour, typography, spacing — with live tokens read from the package), a
component gallery with a playground, a *Decisions* section rendering the ADRs, and `/process`
carrying this plan. Mock it up with Claude Design first.

> **What stops this from being one more docs site:** the colour examples are painted by reading
> `tokens.json` from the published package, not from copied hex values. When a token changes, the
> docs change on their own. Two hours of work, and a lot of credibility.

> **P4 milestone** — Storybook deployed at `/storybook` · Docs site at the Pages root · Six MDX files
> with the same structure · The `component-docs` skill created · Colour docs generated from the real
> tokens.

---

### P5 · Visual regression and a real release — 12 h · Week 5

**Goal:** Chromatic required on every PR, and a `1.0.0` published with an automatic changelog and a
written versioning policy.

1. **Chromatic (4 h).** Connect the project, upload the baseline for all six components in both
   modes, enable **TurboSnap** (only re-snapshots what is affected) and make the check required for
   merging. Then deliberately provoke a token change and approve the diff — that screenshot goes into
   the case study.

   > **Watch the snapshot multiplication.** Variants × modes × themes grows fast, and Chromatic's
   > free plan has a monthly cap. Snapshot *every* variant in the base theme across light and dark,
   > and only a handful of representative stories in the second theme. If that still overruns, it is
   > a good moment to document the trimming criteria — a real maintenance decision, and one worth
   > teaching.

2. **Versioning policy (3 h).** `docs/versioning.md`: what counts as breaking in a design system. The
   answer is not obvious — *is changing a colour token minor or major? What about changing a
   component's internal DOM when someone was styling it from outside?* Having a written position on
   that is what distinguishes eight years of real maintenance.
3. **Automated release (3 h).** `release.yml` with the Changesets action: merging to `main` opens a
   *"Version Packages"* PR; merging that one publishes to npm, creates the tag and the GitHub
   Release. Deprecation policy and migration guide documented.
4. **The `1.0.0` (2 h).** With a hand-written major changeset explaining the stability commitment
   being made. That text is content, not paperwork.

> **P5 milestone** — `1.0.0` on npm with CHANGELOG and Release · Chromatic blocking PRs · Versioning
> policy published · The `release-check` skill created.

---

### P6 · Dogfooding: portfolio, CV and the React port — 16 h · Week 6

**Goal:** consume your own package from outside and discover everything you forgot. This is the phase
that teaches you most about your own API.

1. **New repo, external consumer (2 h).**

   ```bash
   mkdir irene-cv && cd irene-cv
   pnpm create astro@latest .
   pnpm add @koalakanibal/koala        # from npm, as a third party
   ```

   **Record every friction** in a file as it appears: a missing export, a type that will not resolve,
   a token that is not exposed, an awkward prop. That list is gold for the case study — and it
   produces a `1.1.0` release fixing them.

2. **Portfolio and CV (8 h).** Built entirely from your own components and tokens. Mock it up with
   Claude Design first. Include a printable version of the CV (CSS `@media print`).

3. **The React port (6 h).** `packages/ui-react`: `Button` and `TextField` in React, reusing **the
   same `.spec.md` and the same test cases**, and the same CSS untouched. Mount them as React islands
   on the docs site, coexisting with the Vue islands on the same page. That last part is the
   definitive visual proof: two frameworks, one styling system, pixel for pixel identical.

> **P6 milestone** — CV published on Pages consuming the npm package · Release `1.1.0` fixing what
> dogfooding surfaced · Two React components living alongside the Vue ones on the docs site.

---

### P7 · The case study — 12 h · Weeks 6–7

**Goal:** turn seven weeks of work into a story that reads in ten minutes and is remembered.

A list of components gets skimmed. A story with conflict gets read. This structure has conflict:

1. **The thesis** — one sentence. *"Design systems don't fail because of their components; they fail
   because of their process."*
2. **The constraints** — seven weeks, one person, a deliberately small scope. Constraints give
   decisions their credibility.
3. **Four decisions with real trade-offs**, three paragraphs each: what the options were, what was
   chosen, what was lost by choosing. Candidates: the three-tier token architecture; the Select that
   documents when not to use it; CSS Modules over Tailwind; native `<dialog>`.
4. **The PR that tells everything** — the token change travelling through Figma, JSON, CSS, the
   contrast test and six visual diffs. With screenshots.
5. **The friction** — what broke. The dogfooding that revealed forgotten exports. The React port that
   exposed a coupling you did not know you had. *This is the section that convinces.* A case study
   without friction reads like marketing.
6. **What the AI proposed and what I decided** — the three Claude Design directions, the chosen one,
   the changes made and why. And the skills as part of the method.
7. **Evidence** — coverage, axe violations found and fixed, bundle size, release time, number of
   ADRs. Numbers, not adjectives.
8. **What I left out and what I'd do differently** — close honestly. It is the last thing read and
   what sets the final impression.

> **P7 milestone** — Case study published on the portfolio · Repo README rewritten so the GitHub
> landing tells the same story in twenty lines · A post or thread summarising the project.

---

## The pull request workflow, working solo

Working alone does not mean skipping the process: it means the process is carried by CI and a
structured self-review.

1. **One branch per unit of value.** `feat/button-tdd`, `feat/tokens-color-scale`,
   `chore/chromatic-setup`. If a branch touches two components, it is two branches.
2. **Conventional Commits** — because they feed the changelog, and because the history reads as a
   record of how you think.
3. **Before opening the PR**, run `/code-review` in Claude Code over the branch and resolve what
   comes up. The `pr-review` skill adds a project-specific checklist.
4. **PR from the template**: What · Why · How to test · A11y checklist · Changeset · Link to the
   Chromatic build.
5. **CI is required**: lint, typecheck, tests, axe over every story, build and Chromatic. No
   exceptions, no bypass.
6. **A documented self-review.** GitHub does not let you approve your own PR — which is an
   opportunity, not an obstacle: leave a *self-review* comment noting what you were unsure about and
   how you resolved it. An external reviewer reading the repo finds your reasoning exactly where they
   would look for it.
7. **Squash merge** with a conventional-commit title.
8. **The release PR** is opened by Changesets itself. That one gets read in full before merging: it
   is the one that goes to npm.

---

## Schedule

| Week | Phase | Hours | By the end, this exists |
|---|---|---|---|
| 1 | P0 + start of P1 | 15 | `0.0.1` on npm, CI green, Pages live |
| 2 | End of P1 + start of P2 | 15 | Tokens travelling Figma → CSS, with tests |
| 3 | End of P2 + start of P3 | 16 | Button, TextField, Tabs · `0.2.0` |
| 4 | End of P3 + start of P4 | 16 | All six components · `0.5.0` |
| 5 | End of P4 + P5 | 16 | Docs, Storybook, Chromatic · `1.0.0` |
| 6 | P6 | 16 | CV published · React port · `1.1.0` |
| 7 | P7 | 12 | Case study and final README |

**Total ≈ 106 h.** With time to spare, a seventh component (`Tooltip`, and criterion 1.4.13) is the
best extension. If time runs short, the first thing to cut is the React port in P6 — not the case
study, which is what makes everything else legible.

---

## Rules of the game

The five things that make a seven-week project finish in week seven rather than in limbo.

- **Nothing merges with axe failing.** No exceptions, no "I'll fix it later". It is the only rule
  that guarantees accessibility is built in rather than painted on.
- **No PR without a changeset**, documentation PRs included. The version history should read as a
  narrative.
- **No non-trivial decision without an ADR**, and the ADR is written *before* implementing, not
  afterwards as justification.
- **The time-box outranks the scope.** If the Select eats ten hours, the Select gets simplified and
  the reason gets documented. Cutting scope with judgement is also something the case study teaches.
- **At least one commit a day**, however small. The contribution graph also tells the story of a
  sustained process, and continuity avoids the cost of reloading context.

---

*Plan v1 · Vue 3 · pnpm + Turborepo · Figma Variables → Style Dictionary · Vitest + Playwright +
Chromatic · Changesets · GitHub Pages*
