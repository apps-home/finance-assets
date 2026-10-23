import { describe, expect, it } from 'vitest'

import { omitUndefined } from './omit-undefined'

describe('omitUndefined', () => {
  it('should remove only the undefined entries', () => {
    const result = omitUndefined({ a: 1, b: undefined, c: null, d: 0, e: '' })

    expect(result).toEqual({ a: 1, c: null, d: 0, e: '' })
    expect('b' in result).toBe(false)
  })
})
