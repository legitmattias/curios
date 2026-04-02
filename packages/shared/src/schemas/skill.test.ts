import { describe, it, expect } from 'vitest'
import { SkillSchema } from './skill.js'

describe('SkillSchema', () => {
  it('validates a valid skill', () => {
    const skill = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'TypeScript',
      category: 'Languages',
      sortOrder: 0,
    }

    expect(SkillSchema.parse(skill)).toEqual(skill)
  })

  it('rejects invalid data', () => {
    expect(() => SkillSchema.parse({ name: 123 })).toThrow()
  })
})
