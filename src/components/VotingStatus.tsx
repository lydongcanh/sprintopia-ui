import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Eye, EyeOff } from 'lucide-react'
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
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

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
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">🃏</div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No Active Estimation</h3>
          <p className="text-slate-500 text-center">
            Waiting for an estimation turn to begin...
          </p>
        </CardContent>
      </Card>
    )
  }

  const votedCount = estimations.length
  const totalCount = participants.length
  const votingProgress = totalCount > 0 ? (votedCount / totalCount) * 100 : 0

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-800">
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
          </CardTitle>
          <Badge variant={isActive ? "default" : "secondary"} className="bg-green-100 text-green-800">
            {votedCount}/{totalCount} voted
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-green-100 rounded-full h-2 mt-3">
          <motion.div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${votingProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                  className="relative"
                >
                  {/* Poker Card */}
                  <div className={`
                    relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
                    ${status.hasVoted 
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-lg' 
                      : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300 shadow-md'
                    }
                  `}>
                    
                    {/* Card Back/Front Effect */}
                    <div className="flex flex-col items-center space-y-3">
                      <Avatar className={`h-12 w-12 ring-2 transition-all duration-300 ${
                        status.hasVoted 
                          ? 'ring-blue-400 ring-offset-2' 
                          : 'ring-gray-300'
                      }`}>
                        <AvatarFallback className={`font-semibold ${
                          status.hasVoted 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getInitials(participant.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="text-center space-y-1">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                          {participant.full_name}
                        </div>
                        
                        {/* Voting Status */}
                        <div className="flex items-center justify-center">
                          {(() => {
                            if (status.showValue) {
                              return (
                                <motion.div
                                  initial={{ rotateY: 180, scale: 0 }}
                                  animate={{ rotateY: 0, scale: 1 }}
                                  transition={{ duration: 0.6, type: "spring" }}
                                >
                                  <Badge 
                                    className="px-3 py-1 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                                  >
                                    {status.estimation === 0.5 ? '½' : status.estimation}
                                  </Badge>
                                </motion.div>
                              )
                            }
                            
                            if (status.hasVoted) {
                              return (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.3, type: "spring" }}
                                >
                                  <div className="relative">
                                    {/* Card Back */}
                                    <div className="w-12 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg shadow-lg flex items-center justify-center">
                                      <div className="text-white text-xs font-bold">🃏</div>
                                    </div>
                                    {/* Voted Indicator */}
                                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                                      <CheckCircle2 className="h-3 w-3 text-white" />
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            }
                            
                            return (
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.05, 1],
                                  opacity: [0.7, 1, 0.7]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <div className="w-12 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg shadow-sm flex items-center justify-center border-2 border-dashed border-gray-400">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                </div>
                              </motion.div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tab Count Indicator */}
                    {participant.tab_count > 1 && (
                      <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {participant.tab_count}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        
        {/* Reveal/Hide Button for results */}
        {votedCount > 0 && !isActive && (
          <div className="mt-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full border border-green-300">
                {showResults ? (
                  <>
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="text-green-800 font-medium">Results Revealed</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-green-600" />
                    <span className="text-green-800 font-medium">Cards Hidden</span>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}