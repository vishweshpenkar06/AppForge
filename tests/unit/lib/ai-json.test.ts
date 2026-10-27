import { describe, it, expect } from 'vitest'
import { extractJSON } from '@/lib/ai'

describe('extractJSON', () => {
  it('parses plain, fenced and prose-wrapped JSON', () => {
    expect(extractJSON('{"a":1}')).toEqual({ a: 1 })
    expect(extractJSON('```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(extractJSON('Here you go:\n{"a":1}\nHope that helps')).toEqual({ a: 1 })
  })

  it('tolerates trailing commas', () => {
    expect(extractJSON('{"a":[1,2,],}')).toEqual({ a: [1, 2] })
  })

  it('salvages output truncated mid-string by a token limit', () => {
    const truncated = '{"tables":[{"name":"games"},{"name":"scores"},{"name":"achievements","columns":[{"na'
    // The third table keeps its complete fields; only the partial column is dropped.
    expect(extractJSON(truncated)).toEqual({
      tables: [{ name: 'games' }, { name: 'scores' }, { name: 'achievements' }],
    })
  })

  it('salvages output truncated mid-array', () => {
    const truncated = '{"features":["snake","apple","spike"'
    expect(extractJSON(truncated)).toEqual({ features: ['snake', 'apple', 'spike'] })
  })

  it('returns null when there is no JSON at all', () => {
    expect(extractJSON('I cannot help with that.')).toBeNull()
  })
})
