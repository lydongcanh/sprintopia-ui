import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Participant {
  user_id: string
  full_name: string
  email: string
  tab_count: number
}

interface Estimation {
  user_id: string
  full_name: string
  email: string
  estimation_value: number
}

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
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-2xl p-12 text-center shadow-lg">
        <div className="text-6xl mb-4">🃏</div>
        <h3 className="text-lg font-semibold text-slate-600 mb-2">No Active Estimation</h3>
        <p className="text-slate-500">
          Waiting for an estimation turn to begin...
        </p>
      </div>
    )
  }

  const votedCount = estimations.length
  const totalCount = participants.length
  const votingProgress = totalCount > 0 ? (votedCount / totalCount) * 100 : 0

  return (
    <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-2xl p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-green-800">
            {isActive ? (
              <>
                <Clock className="h-5 w-5 animate-pulse" />
                Voting in Progress
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                Results Revealed
              </>
            )}
          </h2>
          <Badge variant={isActive ? "default" : "secondary"} className="bg-green-100 text-green-800">
            {votedCount}/{totalCount} voted
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-green-100 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${votingProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
      
      {/* Poker Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                  <div className="flex flex-col items-center space-y-3">
                    {/* Card Value or Status */}
                    <div className="flex items-center justify-center min-h-[80px]">
                        {(() => {
                          if (status.showValue) {
                            return (
                              <motion.div
                                initial={{ rotateY: 180, scale: 0 }}
                                animate={{ rotateY: 0, scale: 1 }}
                                transition={{ duration: 0.6, type: "spring" }}
                                className="w-full"
                              >
                                <div className="w-24 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg shadow-xl flex items-center justify-center border-4 border-white">
                                  <span className="text-6xl font-bold text-white">
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
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, type: "spring" }}
                                className="relative"
                              >
                                {/* Card Back - Voted */}
                                <div className="w-24 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg shadow-xl flex items-center justify-center border-4 border-white">
                                  <div className="text-5xl">🃏</div>
                                </div>
                                {/* Checkmark */}
                                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg">
                                  <CheckCircle2 className="h-4 w-4 text-white" />
                                </div>
                              </motion.div>
                            )
                          }
                          
                          return (
                            <motion.div
                              animate={{ 
                                scale: [1, 1.05, 1],
                                opacity: [0.6, 1, 0.6]
                              }}
                              transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              {/* Waiting Card */}
                              <div className="w-24 h-32 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg shadow-md flex items-center justify-center border-4 border-dashed border-gray-500">
                                <Clock className="h-10 w-10 text-gray-600" />
                              </div>
                            </motion.div>
                          )
                        })()}
                      </div>
                      
                      {/* Player Name */}
                      <div className="text-center w-full">
                        <div className="text-xs font-semibold text-gray-900 truncate px-1">
                          {participant.full_name}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tab Count Indicator */}
                    {participant.tab_count > 1 && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
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