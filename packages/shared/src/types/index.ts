export type { Project } from '../schemas/index.js'

export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}
