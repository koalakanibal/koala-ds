import { describe, expect, it } from 'vitest'
import { color } from './index'

type Leaf = { $value?: unknown; $type?: unknown }

function tokensIn(node: unknown, path: string[] = []): [string, Leaf][] {
  if (node === null || typeof node !== 'object') return []
  if ('$value' in node) return [[path.join('.'), node as Leaf]]
  return Object.entries(node).flatMap(([key, value]) => tokensIn(value, [...path, key]))
}

describe('color tokens', () => {
  const tokens = tokensIn(color)

  it('is not empty', () => {
    expect(tokens.length).toBeGreaterThan(0)
  })

  it.each(tokens)('%s declares $value and $type', (_name, token) => {
    expect(token.$value).toBeTypeOf('string')
    expect(token.$type).toBe('color')
  })
})
