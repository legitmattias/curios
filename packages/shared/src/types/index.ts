export type { Project } from '../schemas/project.js'
export type { Skill } from '../schemas/skill.js'
export type { Experience } from '../schemas/experience.js'
export type { Profile } from '../schemas/profile.js'
export type { Education } from '../schemas/education.js'
export type { CvData } from '../schemas/cv.js'
export type { MetricEvent, MetricsSnapshot, WsMessage } from '../schemas/metrics.js'
export type { TranslationInfo, TranslationMeta } from '../schemas/translation.js'

export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}
