import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface Estimation {
  user_id: string
  full_name: string
  email: string
  estimation_value: number
  submitted_at: string
}

interface EstimationTurn {
  id: string
  started_at: string
  ended_at?: string
  estimations: Estimation[]
}

interface EstimationState {
  currentTurn: EstimationTurn | null
  isActive: boolean
  showResults: boolean
  userHasSubmitted: boolean
  allEstimations: Estimation[]
}

export function useEstimation(sendMessage: (event: string, data: unknown) => boolean) {
  const [state, setState] = useState<EstimationState>({
    currentTurn: null,
    isActive: false,
    showResults: false,
    userHasSubmitted: false,
    allEstimations: []
  })

  const startNewTurn = useCallback(() => {
    const turnId = uuidv4()
    const newTurn: EstimationTurn = {
      id: turnId,
      started_at: new Date().toISOString(),
      estimations: []
    }

    setState(prev => ({
      ...prev,
      currentTurn: newTurn,
      isActive: true,
      showResults: false,
      userHasSubmitted: false,
      allEstimations: []
    }))

    // Broadcast the new turn to all participants
    const success = sendMessage('start_estimation_turn', {
      turn_id: turnId,
      started_at: newTurn.started_at
    })

    if (!success) {
      console.error('Failed to broadcast start estimation turn')
    }

    return turnId
  }, [sendMessage])

  const submitEstimation = useCallback((userInfo: { user_id: string; full_name: string; email: string }, value: number) => {
    if (!state.currentTurn || !state.isActive || state.userHasSubmitted) {
      return false
    }

    const estimation: Estimation = {
      ...userInfo,
      estimation_value: value,
      submitted_at: new Date().toISOString()
    }

    setState(prev => ({
      ...prev,
      userHasSubmitted: true,
      allEstimations: [...prev.allEstimations.filter(e => e.user_id !== userInfo.user_id), estimation]
    }))

    // Broadcast the estimation to all participants
    const success = sendMessage('estimation_submitted', {
      turn_id: state.currentTurn.id,
      user_id: userInfo.user_id,
      full_name: userInfo.full_name,
      email: userInfo.email,
      estimation_value: value,
      submitted_at: estimation.submitted_at
    })

    if (!success) {
      console.error('Failed to broadcast estimation')
      // Revert the state if broadcast failed
      setState(prev => ({
        ...prev,
        userHasSubmitted: false,
        allEstimations: prev.allEstimations.filter(e => e.user_id !== userInfo.user_id)
      }))
      return false
    }

    return true
  }, [state.currentTurn, state.isActive, state.userHasSubmitted, sendMessage])

  const endCurrentTurn = useCallback(() => {
    if (!state.currentTurn || !state.isActive) {
      return false
    }

    const endedAt = new Date().toISOString()

    setState(prev => ({
      ...prev,
      isActive: false,
      showResults: true,
      currentTurn: prev.currentTurn ? {
        ...prev.currentTurn,
        ended_at: endedAt,
        estimations: prev.allEstimations
      } : null
    }))

    // Broadcast the end turn to all participants
    const success = sendMessage('end_estimation_turn', {
      turn_id: state.currentTurn.id,
      ended_at: endedAt,
      estimations: state.allEstimations
    })

    if (!success) {
      console.error('Failed to broadcast end estimation turn')
    }

    return true
  }, [state.currentTurn, state.isActive, state.allEstimations, sendMessage])

  const handleRemoteEvent = useCallback((event: string, data: Record<string, unknown>) => {
    switch (event) {
      case 'start_estimation_turn':
        setState(prev => ({
          ...prev,
          currentTurn: {
            id: data.turn_id as string,
            started_at: data.started_at as string,
            estimations: []
          },
          isActive: true,
          showResults: false,
          userHasSubmitted: false,
          allEstimations: []
        }))
        break

      case 'estimation_submitted':
        setState(prev => {
          const newEstimation: Estimation = {
            user_id: data.user_id as string,
            full_name: data.full_name as string,
            email: data.email as string,
            estimation_value: data.estimation_value as number,
            submitted_at: data.submitted_at as string
          }
          
          return {
            ...prev,
            allEstimations: [
              ...prev.allEstimations.filter(e => e.user_id !== (data.user_id as string)),
              newEstimation
            ]
          }
        })
        break

      case 'end_estimation_turn':
        setState(prev => ({
          ...prev,
          isActive: false,
          showResults: true,
          allEstimations: (data.estimations as Estimation[]) || prev.allEstimations,
          currentTurn: prev.currentTurn ? {
            ...prev.currentTurn,
            ended_at: data.ended_at as string,
            estimations: (data.estimations as Estimation[]) || prev.allEstimations
          } : null
        }))
        break

      case 'sync_estimation_state':
        // Handle state synchronization for new users joining
        setState(prev => ({
          ...prev,
          currentTurn: data.current_turn as EstimationTurn | null,
          isActive: data.is_active as boolean,
          showResults: data.show_results as boolean,
          allEstimations: (data.estimations as Estimation[]) || [],
          userHasSubmitted: (data.estimations as Estimation[])?.some((e: Estimation) => e.user_id === prev.currentTurn?.id) || false
        }))
        break

      default:
        break
    }
  }, [])

  const syncStateForNewUser = useCallback(() => {
    // Send current state to help new users catch up
    if (state.currentTurn) {
      const success = sendMessage('sync_estimation_state', {
        current_turn: state.currentTurn,
        is_active: state.isActive,
        show_results: state.showResults,
        estimations: state.allEstimations
      })

      if (!success) {
        console.error('Failed to sync state for new user')
      }
    }
  }, [state, sendMessage])

  const resetState = useCallback(() => {
    setState({
      currentTurn: null,
      isActive: false,
      showResults: false,
      userHasSubmitted: false,
      allEstimations: []
    })
  }, [])

  return {
    state,
    startNewTurn,
    submitEstimation,
    endCurrentTurn,
    handleRemoteEvent,
    syncStateForNewUser,
    resetState,
    // Computed values
    canSubmit: state.isActive && !state.userHasSubmitted,
    canEndTurn: state.isActive && state.allEstimations.length > 0,
    participantCount: state.allEstimations.length,
    hasEstimations: state.allEstimations.length > 0
  }
}