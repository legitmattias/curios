import { describe, it, expect } from 'vitest'
import { EducationSchema } from './education.js'

describe('EducationSchema', () => {
  it('validates a valid education entry', () => {
    const education = {
      id: '00000000-0000-0000-0000-000000000001',
      institution: 'Linnaeus University',
      degree: 'Bachelor of Science',
      field: 'Software Engineering',
      startDate: '2024-09-01',
      endDate: null,
      description: 'Studying software engineering.',
      sortOrder: 0,
    }

    expect(EducationSchema.parse(education)).toEqual(education)
  })

  it('validates with an end date', () => {
    const education = {
      id: '00000000-0000-0000-0000-000000000002',
      institution: 'Tech Institute',
      degree: 'Diploma',
      field: 'Web Development',
      startDate: '2018-08-01',
      endDate: '2019-06-15',
      description: null,
      sortOrder: 1,
    }

    expect(EducationSchema.parse(education)).toEqual(education)
  })

  it('rejects invalid data', () => {
    expect(() => EducationSchema.parse({ institution: 123 })).toThrow()
  })
})
