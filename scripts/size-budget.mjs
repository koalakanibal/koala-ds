/**
 * Fails when the published bundle grows past its budget.
 *
 * Budgets sit just above current size on purpose: a generous limit never fires.
 * When a component lands and the limit has to rise, that rise shows up in a
 * diff and gets read.
 */
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

// Measured 2026-09-07: index.js 269 B, styles.css 144 B. Raise these
// deliberately when a component lands, never to make a red build go away.
const BUDGET = {
  'packages/ui/dist/index.js': 350,
  'packages/ui/dist/styles.css': 200,
}

let failed = false

for (const [path, limit] of Object.entries(BUDGET)) {
  const gzipped = gzipSync(readFileSync(path)).length
  const over = gzipped > limit
  if (over) failed = true
  console.log(`${over ? '✗' : '✓'} ${path}  ${gzipped} B gzipped  (budget ${limit} B)`)
}

process.exit(failed ? 1 : 0)
