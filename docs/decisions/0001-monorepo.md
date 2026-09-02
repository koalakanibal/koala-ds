# 0001 · One monorepo, not several repositories

Status: accepted · 2026-09-01

## Context

Koala has four pieces that change together: the design tokens, the Vue component
library, a planned React port, and a site that is both the landing and the
documentation. A change to a single colour token touches all four.

## Options

**Separate repositories, one per piece.** A colour change becomes three pull
requests and three npm releases, in a fixed order, before the site can show it.
Buys clean ownership boundaries, which nobody needs here — there is one person.

**A single package.** Tokens as a folder inside the component library, plus the
site. The simplest option, and enough for everything planned before P6.

**One monorepo with pnpm workspaces.** Packages linked locally, so a token change
is visible in the components and the site immediately, in one pull request, under
one CI run.

## Decision

One monorepo: pnpm workspaces plus Turborepo.

Two things justify it, and neither is "it is the standard shape":

- The React port in P6 needs `ui` and `ui-react` to share the same tokens. There
  is no clean way for two libraries to share a folder that lives inside one of
  them.
- The site consuming the library as a package is what proves the package works. A
  site importing from `../src` proves nothing.

## Consequences

The setup cost is paid up front: workspaces, a task runner, per-package configs.

All packages share one version of each build dependency. Two packages cannot sit
on different TypeScript versions without pain.

CI has to be selective about what it rebuilds or it gets slow as packages are
added. That is why Turborepo is here rather than plain `pnpm -r`.

**The honest caveat:** the plan names the React port as the first thing to cut if
time runs short. If it is cut, this decision rests on the site alone, and a single
package would have been simpler. Revisit it then rather than defending it out of
habit.
