import { describe, it, expect } from 'vitest'
import { ExperienceSchema } from './experience.js'

describe('ExperienceSchema', () => {
  it('validates a valid experience entry', () => {
    const experience = {
      id: '00000000-0000-0000-0000-000000000001',
      company: 'Acme Corp',
      role: 'Senior Developer',
      description: 'Built things.',
      startDate: '2023-01-15',
      endDate: null,
      tech: ['TypeScript', 'PostgreSQL'],
      sortOrder: 0,
    }

    expect(ExperienceSchema.parse(experience)).toEqual(experience)
  })

  it('validates with an end date', () => {
    const experience = {
      id: '00000000-0000-0000-0000-000000000002',
      company: 'Old Corp',
      role: 'Developer',
      description: 'Built other things.',
      startDate: '2020-06-01',
      endDate: '2022-12-31',
      tech: ['JavaScript'],
      sortOrder: 1,
    }

    expect(ExperienceSchema.parse(experience)).toEqual(experience)
  })

  it('rejects invalid data', () => {
    expect(() => ExperienceSchema.parse({ company: 123 })).toThrow()
  })
})
