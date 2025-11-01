/**
 * Session-related type definitions
 */

export interface Estimation {
  user_id: string
  full_name: string
  email: string
  estimation_value: number
}

export interface EstimationState {
  isActive: boolean
  currentTurnId: string | null
  estimations: Estimation[]
  userHasSubmitted: boolean
  showResults: boolean
}

export interface Participant {
  user_id: string
  full_name: string
  email: string
  tab_count: number
}
