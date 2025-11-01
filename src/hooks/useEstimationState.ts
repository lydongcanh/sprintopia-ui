import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface EstimationTurn {
  id: string
  started_at: string
  ended_at?: string
  is_active: boolean
}

export interface UserEstimation {
  user_id: string
  full_name: string
  estimation_value: number
  submitted_at: string
}

export interface EstimationState {
  current_turn: EstimationTurn | null
  estimations: UserEstimation[]
  revealed: boolean
}

export interface UseEstimationStateOptions {
  onStateChange?: (state: EstimationState) => void
  sendMessage?: (event: string, payload: unknown) => boolean
}

export function useEstimationState(
  sessionId: string,
  currentUserId: string,
  options: UseEstimationStateOptions = {}
) {
  const { onStateChange, sendMessage } = options
  const [estimationState, setEstimationState] = useState<EstimationState>({
    current_turn: null,
    estimations: [],
    revealed: false
  })

  // Update state and notify listeners
  const updateState = useCallback((newState: Partial<EstimationState>) => {
    setEstimationState(prev => {
      const updated = { ...prev, ...newState }
      onStateChange?.(updated)
      return updated
    })
  }, [onStateChange])

  // Start a new estimation turn
  const startEstimationTurn = useCallback(() => {
    const newTurn: EstimationTurn = {
      id: uuidv4(),
      started_at: new Date().toISOString(),
      is_active: true
    }

    const newState = {
      current_turn: newTurn,
      estimations: [],
      revealed: false
    }

    updateState(newState)

    // Broadcast the new turn to all users
    sendMessage?.('estimation_turn_started', {
      session_id: sessionId,
      turn: newTurn,
      estimations: [],
      revealed: false
    })
  }, [sessionId, sendMessage, updateState])

  // Submit an estimation
  const submitEstimation = useCallback((estimationValue: number, userFullName: string) => {
    if (!estimationState.current_turn?.is_active) return false

    const newEstimation: UserEstimation = {
      user_id: currentUserId,
      full_name: userFullName,
      estimation_value: estimationValue,
      submitted_at: new Date().toISOString()
    }

    // Update local state
    const updatedEstimations = [
      ...estimationState.estimations.filter(e => e.user_id !== currentUserId),
      newEstimation
    ]

    updateState({
      estimations: updatedEstimations
    })

    // Broadcast the estimation to all users
    sendMessage?.('estimation_submitted', {
      session_id: sessionId,
      turn_id: estimationState.current_turn.id,
      estimation: newEstimation,
      estimations: updatedEstimations
    })

    return true
  }, [currentUserId, estimationState, sendMessage, sessionId, updateState])

  // Reveal all estimations
  const revealEstimations = useCallback(() => {
    if (!estimationState.current_turn) return false

    const endedTurn = {
      ...estimationState.current_turn,
      ended_at: new Date().toISOString(),
      is_active: false
    }

    const newState = {
      current_turn: endedTurn,
      revealed: true
    }

    updateState(newState)

    // Broadcast the reveal to all users
    sendMessage?.('estimations_revealed', {
      session_id: sessionId,
      turn: endedTurn,
      estimations: estimationState.estimations,
      revealed: true
    })

    return true
  }, [estimationState, sendMessage, sessionId, updateState])

  // Handle incoming real-time messages
  const handleEstimationMessage = useCallback((event: string, payload: unknown) => {
    const data = payload as any
    if (data.session_id !== sessionId) return

    switch (event) {
      case 'estimation_turn_started':
        updateState({
          current_turn: data.turn,
          estimations: data.estimations || [],
          revealed: data.revealed || false
        })
        break

      case 'estimation_submitted':
        if (data.turn_id === estimationState.current_turn?.id) {
          updateState({
            estimations: data.estimations || []
          })
        }
        break

      case 'estimations_revealed':
        updateState({
          current_turn: data.turn,
          estimations: data.estimations || [],
          revealed: data.revealed || true
        })
        break

      case 'session_state_sync':
        // For new users joining - sync the current state
        updateState({
          current_turn: data.current_turn,
          estimations: data.estimations || [],
          revealed: data.revealed || false
        })
        break
    }
  }, [sessionId, estimationState.current_turn?.id, updateState])

  // Sync current state to new users
  const syncStateToNewUsers = useCallback(() => {
    if (estimationState.current_turn) {
      sendMessage?.('session_state_sync', {
        session_id: sessionId,
        current_turn: estimationState.current_turn,
        estimations: estimationState.estimations,
        revealed: estimationState.revealed
      })
    }
  }, [estimationState, sendMessage, sessionId])

  // Get current user's estimation
  const getCurrentUserEstimation = useCallback(() => {
    return estimationState.estimations.find(e => e.user_id === currentUserId)
  }, [estimationState.estimations, currentUserId])

  // Check if all participants have estimated
  const areAllParticipantsReady = useCallback((participantCount: number) => {
    return estimationState.estimations.length >= participantCount && participantCount > 0
  }, [estimationState.estimations.length])

  // Get estimation statistics
  const getEstimationStats = useCallback(() => {
    if (!estimationState.revealed || estimationState.estimations.length === 0) {
      return null
    }

    const values = estimationState.estimations.map(e => e.estimation_value).sort((a, b) => a - b)
    const average = values.reduce((sum, val) => sum + val, 0) / values.length
    const median = values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)]

    return {
      average: Math.round(average * 10) / 10,
      median,
      min: values[0],
      max: values.at(-1)!,
      count: values.length
    }
  }, [estimationState.estimations, estimationState.revealed])

  return {
    estimationState,
    startEstimationTurn,
    submitEstimation,
    revealEstimations,
    handleEstimationMessage,
    syncStateToNewUsers,
    getCurrentUserEstimation,
    areAllParticipantsReady,
    getEstimationStats,
    
    // Computed properties
    hasActiveTurn: !!estimationState.current_turn?.is_active,
    hasEstimations: estimationState.estimations.length > 0,
    isRevealed: estimationState.revealed,
    canReveal: estimationState.current_turn?.is_active && estimationState.estimations.length > 0
  }
}