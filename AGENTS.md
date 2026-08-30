# Koala — agent & contributor guide

Koala is a small, complete design system: design tokens plus six components, built to demonstrate
the whole cycle — design → TDD → accessibility → docs → release.

Read [`docs/plan.md`](docs/plan.md) for the reasoning behind every decision below, and
[`docs/progress.md`](docs/progress.md) for current state.

## Language

**Everything in this repository is written in English** — code, comments, commit messages, ADRs,
component specs, Storybook docs, the documentation site and the README. No exceptions.

## Stack

| | |
|---|---|
| Package manager | pnpm workspaces + Turborepo |
| Library | Vue 3 + TypeScript |
| Styles | CSS Modules + custom properties + `@layer`. No preprocessor |
| Tests | Vitest + Testing Library + vitest-axe; Playwright for real focus/keyboard |
| Visual | Chromatic (TurboSnap) |
| Release | Changesets → npm (`@koalakanibal/koala`) |
| Docs | Storybook for implementers, Astro site for everyone else |

## Commands

```bash
pnpm verify        # lint + typecheck + test + build — run before opening a PR
pnpm test          # unit + a11y tests
pnpm changeset     # describe a change; required in every PR
```

## Token architecture

Three tiers, and the tier boundary is enforced by tests:

```css
--koala-teal-600            /* primitive — raw value, never used by a component */
--koala-color-action-bg     /* semantic  — what components consume */
--koala-button-bg           /* component — controlled escape hatch for consumers */
```

- Semantic tokens must reference a primitive, never a literal value.
- **Component CSS must never reference a primitive.** This is what makes the system themeable.
- Themes are scoped to any container via `[data-koala-theme]`, not just `:root`, so two themes can
  render on the same page.
- Cascade layers: `@layer koala.reset, koala.tokens, koala.components, koala.overrides`.

## Component conventions

- Behaviour is specified in prose in `Component.spec.md` **before** any test or implementation.
  Every line of the contract becomes a test.
- Variants and states are expressed as `data-*` attributes, never as combined class names:
  `.root[data-variant="primary"]`, `.root[data-loading]`.
- After the spec and before writing code, state the intended approach in a few lines and get it
  corrected. Correcting an approach costs a minute; correcting an implementation costs an hour.
- Every component ships stories covering all variants, both colour modes, and one second-theme
  story as a canary for leaked primitive references.
- Every component gets an adversarial pass before its PR: overlong content, absurd props, deep
  nesting, 200 % zoom, RTL.

## Accessibility

Non-negotiable: nothing merges with a failing axe check. Automated checks catch roughly a third of
real problems, so every component also carries a hand-written keyboard matrix in its spec and a
documented screen-reader pass.

## Testing

Green does not mean good. Tests written by an agent can pass while asserting nothing that matters,
so tests are reviewed as an artefact in their own right, separately from the implementation they
cover. At least once per component, break the implementation on purpose and confirm a test goes red.

## Committing

**Never commit without showing the changes first and getting explicit approval.** Before any
`git commit`: run `git status --short` and `git diff --staged`, explain in plain language what
changed and why, and wait for a yes.

This is enforced, not trusted: `.claude/hooks/review-before-commit.mjs` intercepts every `git commit`
and turns it into an approval prompt carrying the staged diff, so a commit cannot be approved blind.

**Attribution.** Work done with an agent carries a `Co-Authored-By` trailer; work done solo does not.
The distinction is deliberate: it makes the history a readable record of where the collaboration
actually happened, rather than a blanket claim in either direction.

## Pull requests

- One branch per unit of value. Conventional Commits.
- Every PR needs a changeset — documentation PRs included.
- CI must be green: lint, typecheck, tests, axe over all stories, build, Chromatic.
- Leave a self-review comment noting what you were unsure about and how you resolved it.
- Every new dependency is justified in one line: why this one, what it weighs, what it pulls in,
  and whether it ships to consumers or stays in the build.
- Anything a review surfaces that will recur goes back into this file or into a skill. A review that
  only fixes one pull request was half wasted.
- Squash merge, conventional-commit title.

## Decisions

Non-trivial decisions get an ADR in `docs/decisions/`, written **before** implementing, in the form
*Context · Options · Decision · Consequences*. Documenting what was rejected matters as much as
what was chosen.
