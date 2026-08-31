# Koala — agent & contributor guide

Koala is a small, complete design system: design tokens plus four components, built to demonstrate
the whole cycle — design → TDD → accessibility → docs → release.

Why every rule below exists is in [`docs/plan.md`](docs/plan.md). Current state is in
[`docs/progress.md`](docs/progress.md).

**Everything in this repository is written in English** — code, comments, commits, specs, docs. No
exceptions.

---

## 1. Stack and commands

| | |
|---|---|
| Library | Vue 3 + TypeScript |
| Styles | CSS Modules + custom properties + `@layer`. No preprocessor |
| Tests | Vitest + Testing Library + vitest-axe; Playwright for real focus and keyboard |
| Docs & release | Storybook, an Astro site, Changesets → npm as `@koalakanibal/koala` |

```bash
pnpm install       # pnpm only — npm or yarn here breaks the workspace links
pnpm verify        # lint + typecheck + test + build — run before opening a PR
pnpm test          # every test in every package
pnpm changeset     # describe a change; required in every PR
```

While iterating, run one test file rather than the whole suite.

---

## 2. Execution workflow

Chronological. Phases 1 and 2 apply to every task, without exception. Phase 3 applies when the task
is a component; other work — an ADR, a CI change, a docs edit — goes from phase 2 to phase 4.

### Phase 1 · Inspection (read-only)

- Read-only inspection needs no approval. It is how you verify.
- Consult `docs/plan.md` for the reasoning behind a rule and `docs/progress.md` for where the work
  actually is. Neither is read in full for every task.
- Claude Design output is for exploration only: never production CSS, never the final tokens, never
  an accessibility decision.

### Phase 2 · Proposal and approval (hold)

- **State the intended approach and wait for explicit approval** before running anything that writes
  to disk, installs, touches git, or reaches the network.
- Naming a destination does not approve the execution. "Install the toolchain" is a destination; wait
  for a yes on the *how*. Correcting an approach costs a minute; correcting an execution costs an
  hour and a revert.
- **Offer the choice of who executes** — the human or the agent. Ask, never assume. Whoever does not
  execute verifies.

### Phase 3 · Implementation, test-first

- Behaviour is specified in prose in `Component.spec.md` **before** any test or implementation, and
  every line of the contract becomes a test.
- Tests are reviewed as their own artefact, separately from the implementation they cover.
- Once per component, break the implementation on purpose and confirm a test goes red. A test that
  has never been red has never been tested.

### Phase 4 · Verification and git

- `pnpm verify` passes before a PR is opened. CI is required and is not bypassed.
- **Never commit without showing the changes and getting an explicit yes.** Run `git status --short`
  and `git diff --staged`, and explain in plain language what changed and why.
- Agent-assisted work carries a `Co-Authored-By` trailer and solo work does not, so the history reads
  as a record of where the collaboration actually happened.

---

## 3. Tokens and CSS architecture

Three tiers. Components consume the middle one and never the first:

```css
color: var(--koala-teal-600);         /* ✗ primitive — never in component CSS */
color: var(--koala-color-action-bg);  /* ✓ semantic — this is what components use */
```

- `--koala-button-bg` is the third tier: a per-component escape hatch for consumers.
- A semantic token references a primitive, never a literal value.
- **No component CSS references a primitive.** This single rule is what makes the system themeable,
  and a test enforces it.
- Themes are scoped with `[data-koala-theme]` on any container, not only `:root`, so two themes can
  render on the same page.
- Cascade layers: `@layer koala.reset, koala.tokens, koala.components, koala.overrides;`

---

## 4. Component conventions

**Nothing merges with a failing axe check.** And zero violations is not the same as accessible — axe
catches roughly a third of real problems, which is why the hand-written keyboard matrix and the
screen-reader pass are not optional.

- Variants and states are `data-*` attributes, never combined class names: `.root[data-loading]`,
  not `.button--loading`.
- Stories cover every variant in both colour modes, plus one story under the second theme — if it
  breaks there, a primitive reference has leaked in.
- Every component gets an adversarial pass before its PR: overlong content, absurd props, deep
  nesting, 200 % zoom, RTL.
- Every component carries a hand-written keyboard matrix in its spec and a documented screen-reader
  pass.

---

## 5. Documentation and pull requests

- **Two records are not edited quietly.** `docs/plan.md` is versioned on purpose: when reality
  contradicts it, change it in a commit that says why. `docs/progress.md` is written as work lands,
  never afterwards — it is the case study's only source, and written late it is written blander.
- One branch per unit of value. Conventional Commits. Squash merge, conventional title.
- Every PR needs a changeset — documentation PRs included.
- Every new dependency is justified in one line: why this one, what it weighs, what it pulls in, and
  whether it ships to consumers or stays in the build.
- Anything a review surfaces that will recur comes back into this file or into a skill. A review that
  only fixes one pull request was half wasted.

The per-PR checklist lives in `.github/pull_request_template.md` and is not repeated here.

---

## 6. Decisions

Non-trivial decisions get an ADR in `docs/decisions/`, written **before** implementing, as
*Context · Options · Decision · Consequences*. What was rejected matters as much as what was chosen.

An ADR is not only for components: the monorepo shape and the package registry get one too.
