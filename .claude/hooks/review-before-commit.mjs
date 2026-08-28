#!/usr/bin/env node
/**
 * Review-before-commit hook (PreToolUse on Bash).
 *
 * Intercepts any `git commit` and turns it into an explicit approval prompt that
 * carries the staged diff, so the commit can never be approved blind.
 *
 * Exits 0 in every case: this hook asks, it does not block.
 */
import { execSync } from 'node:child_process'

const MAX_REVIEW_CHARS = 4000

let raw = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => (raw += chunk))
process.stdin.on('end', () => {
  let command = ''
  try {
    command = JSON.parse(raw)?.tool_input?.command ?? ''
  } catch {
    // Malformed payload: stay out of the way.
    process.exit(0)
  }

  // Any `git … commit` within a single command segment: covers `git commit`,
  // `git -C dir commit`, `git -c user.name=x commit` and `pnpm test && git commit`.
  // Deliberately broad — a needless prompt costs nothing, a missed commit defeats the rule.
  const isCommit = /(?:^|[;&|]|\s)git\b[^;&|]*\bcommit\b/.test(command)
  if (!isCommit) process.exit(0)

  let review
  try {
    const stat = execSync('git diff --staged --stat', { encoding: 'utf8' }).trim()
    const status = execSync('git status --short', { encoding: 'utf8' }).trim()
    review = stat ? `Staged for this commit:\n${stat}` : 'Nothing is staged yet.'
    if (status) review += `\n\nWorking tree:\n${status}`
  } catch {
    review = 'Could not read the diff — check the repository state manually.'
  }

  if (review.length > MAX_REVIEW_CHARS) {
    review = `${review.slice(0, MAX_REVIEW_CHARS)}\n… (truncated)`
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason:
          `Review before commit.\n\n${review}\n\n` +
          'Only approve if these changes have been walked through with you first.',
      },
    }),
  )
  process.exit(0)
})
