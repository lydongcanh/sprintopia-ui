import { CheckCircle2, Clock, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Participant, Estimation } from '@/types/session'

interface VotingStatusProps {
  readonly participants: Participant[]
  readonly estimations: Estimation[]
  readonly isActive: boolean
  readonly showResults: boolean
}

export function VotingStatus({ participants, estimations, isActive, showResults }: VotingStatusProps) {
  const getVotingStatus = (participant: Participant) => {
    const hasVoted = estimations.some(e => e.user_id === participant.user_id)
    const estimation = estimations.find(e => e.user_id === participant.user_id)
    
    return {
      hasVoted,
      estimation: estimation?.estimation_value,
      showValue: showResults && hasVoted
    }
  }

  if (!isActive && estimations.length === 0) {
    return (
      <div className="neu-pressed rounded-3xl p-16 text-center">
        <div className="text-7xl mb-6">🃏</div>
        <h3 className="text-2xl font-semibold text-muted-foreground mb-3">No Active Estimation</h3>
        <p className="text-muted-foreground text-lg">
          Waiting for an estimation turn to begin...
        </p>
      </div>
    )
  }

  const votedCount = estimations.length
  const totalCount = participants.length
  const votingProgress = totalCount > 0 ? (votedCount / totalCount) * 100 : 0

  return (
    <div className="rounded-3xl p-8 neu-elevated bg-background">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-3 text-2xl font-bold">
            {isActive ? (
              <>
                <Clock className="h-6 w-6 animate-pulse text-primary" />
                Voting in Progress
              </>
            ) : (
              <>
                <Eye className="h-6 w-6 text-primary" />
                Results Revealed
              </>
            )}
          </h2>
          <div className="px-5 py-2 rounded-xl neu-elevated bg-background">
            <span className="font-bold text-lg">
              {votedCount}/{totalCount} voted
            </span>
          </div>
        </div>
        
        {/* Progress Bar with inline percentage */}
        <div className="relative w-full bg-muted rounded-full h-4 neu-pressed-sm overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-primary via-purple-500 to-accent h-4 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${votingProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {votingProgress > 15 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
                {Math.round(votingProgress)}%
              </span>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Poker Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <AnimatePresence>
            {participants.map((participant) => {
              const status = getVotingStatus(participant)
              
              return (
                <motion.div
                  key={participant.user_id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-col items-center space-y-4">
                    {/* Card Value or Status */}
                    <div className="flex items-center justify-center min-h-[100px]">
                        {(() => {
                          if (status.showValue) {
                            return (
                              <motion.div
                                initial={{ rotateY: 180, scale: 0 }}
                                animate={{ rotateY: 0, scale: 1 }}
                                transition={{ duration: 0.6, type: "spring" }}
                                className="w-full"
                              >
                                <div className="w-28 h-40 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-xl flex items-center justify-center">
                                  <span className="text-7xl font-bold text-white">
                                    {(() => {
                                      if (status.estimation === -1) return '?';
                                      if (status.estimation === 0.5) return '½';
                                      return status.estimation;
                                    })()}
                                  </span>
                                </div>
                              </motion.div>
                            )
                          }
                          
                          if (status.hasVoted) {
                            return (
                              <motion.div
                                initial={{ scale: 0, rotateY: 180 }}
                                animate={{ scale: 1, rotateY: 0 }}
                                transition={{ duration: 0.6, type: "spring" }}
                                className="relative"
                              >
                                {/* Card Back - Voted */}
                                <div className="w-28 h-40 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-xl">
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>
                                  <div className="text-6xl relative z-10">🃏</div>
                                </div>
                                {/* Checkmark with glow */}
                                <div className="absolute -top-3 -right-3 bg-green-500 rounded-full p-2 shadow-lg status-glow-green animate-pulse">
                                  <CheckCircle2 className="h-5 w-5 text-white" />
                                </div>
                              </motion.div>
                            )
                          }
                          
                          return (
                            <motion.div
                              animate={{ 
                                scale: [1, 1.02, 1],
                                opacity: [0.5, 0.7, 0.5]
                              }}
                              transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="relative"
                            >
                              {/* Waiting Card with pulsing border */}
                              <div className="w-28 h-40 bg-muted rounded-2xl neu-pressed flex items-center justify-center border-2 border-dashed border-muted-foreground/20 relative">
                                <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-pulse"></div>
                                <Clock className="h-12 w-12 text-muted-foreground relative z-10" />
                              </div>
                            </motion.div>
                          )
                        })()}
                      </div>
                      
                      {/* Player Name */}
                      <div className="text-center w-full">
                        <div className="text-sm font-semibold truncate px-2 py-1 rounded-lg neu-elevated-sm bg-background">
                          {participant.full_name}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tab Count Indicator */}
                    {participant.tab_count > 1 && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold neu-elevated-sm">
                        {participant.tab_count}
                      </div>
                    )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    )
}