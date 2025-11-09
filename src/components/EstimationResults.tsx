import { Button } from '@/components/ui/button'
import { RotateCcw, Target, TrendingUp } from 'lucide-react'
import { CONSENSUS_THRESHOLD } from '@/constants/estimation'
import type { Estimation } from '@/types/session'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface EstimationResultsProps {
  readonly estimations: Estimation[]
  readonly onStartNewTurn: () => void
  readonly isStartingNewTurn?: boolean
}

export function EstimationResults({ estimations, onStartNewTurn, isStartingNewTurn = false }: EstimationResultsProps) {
  // Calculate simple statistics - filter out invalid values (< 0 or undefined)
  const values = estimations
    .map(e => e.estimation_value)
    .filter(v => v !== undefined && v !== null && v >= 0)
    .sort((a, b) => a - b)
  const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  
  const formatValue = (value: number | undefined) => {
    if (value === undefined || value === null) return '?'
    if (value === 0.5) return '½'
    return value.toString()
  }

  // Check for consensus (all values within threshold)
  const hasConsensus = values.length > 0 && (values.at(-1)! - values[0] <= CONSENSUS_THRESHOLD)

  // Trigger celebration effect when consensus is reached
  useEffect(() => {
    if (hasConsensus && estimations.length > 0) {
      // Fire confetti from multiple angles for a more dramatic effect
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // Fire from left side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        
        // Fire from right side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [hasConsensus, estimations.length])

  // Trigger discussion effect when no consensus
  useEffect(() => {
    if (!hasConsensus && estimations.length > 0 && values.length > 0) {
      // Create a subtle "thinking" shake effect on the card
      const card = document.querySelector('.estimation-results-card')
      if (card) {
        card.classList.add('shake-animation')
        setTimeout(() => {
          card.classList.remove('shake-animation')
        }, 500)
      }
    }
  }, [hasConsensus, estimations.length, values.length])

  return (
    <div className="border-0 estimation-results-card neu-elevated rounded-3xl p-8">
      <style>{`
        .shake-animation {
          animation: shake 0.5s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
      <div className="space-y-8 text-center">
        {estimations.length === 0 ? (
          <div className="space-y-6 py-8">
            <div className="text-6xl">🤔</div>
            <p className="text-muted-foreground text-xl">No votes submitted</p>
          </div>
        ) : (
          <>
            {/* Main Result */}
            <div className="space-y-6">
              {hasConsensus ? (
                <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                  <div className="text-7xl animate-bounce">🎉</div>
                  <h3 className="text-3xl font-bold text-green-600 animate-in slide-in-from-bottom duration-300">
                    Great Consensus!
                  </h3>
                  <div className="flex items-center justify-center gap-3 bg-green-50 rounded-2xl p-8 neu-elevated">
                    <Target className="w-8 h-8 text-green-600" />
                    <span className="text-7xl font-bold text-green-600">{formatValue(Math.round(average))}</span>
                    <span className="text-2xl text-green-600 font-semibold">points</span>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Everyone agrees! The team is aligned 🎯
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                  <div className="text-7xl animate-pulse">💭</div>
                  <h3 className="text-3xl font-bold text-orange-600 animate-in slide-in-from-bottom duration-300">
                    Let's Discuss!
                  </h3>
                  <div className="bg-orange-50 rounded-2xl p-8 neu-elevated space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                      <div className="text-center">
                        <p className="text-sm text-orange-700 font-semibold mb-2">
                          Estimate Range
                        </p>
                        <p className="text-5xl font-bold text-orange-600">
                          {formatValue(values[0])} - {formatValue(values.at(-1))}
                        </p>
                        <p className="text-lg text-orange-600 font-medium mt-2">
                          {values.at(-1)! - values[0]} point difference
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex justify-center gap-16 text-sm border-t pt-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-2 text-sm">Votes</p>
                <p className="font-bold text-3xl">{estimations.length}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground mb-2 text-sm">Average</p>
                <p className="font-bold text-3xl">{average.toFixed(1)}</p>
              </div>
            </div>
          </>
        )}

        {/* Next Action */}
        <Button 
          onClick={onStartNewTurn} 
          disabled={isStartingNewTurn}
          size="lg"
          className="w-full text-lg"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          {isStartingNewTurn ? 'Starting...' : 'Start Next Round'}
        </Button>
      </div>
    </div>
  )
}