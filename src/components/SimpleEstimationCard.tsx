import { useState } from 'react'
import { CheckCircle2, Timer } from 'lucide-react'
import { STORY_POINTS } from '@/constants/estimation'

interface SimpleEstimationCardProps {
  readonly onSubmitEstimation: (value: number) => void
  readonly currentEstimation?: number
  readonly hasActiveTurn: boolean
  readonly isRevealed: boolean
}

export function SimpleEstimationCard({
  onSubmitEstimation,
  currentEstimation,
  hasActiveTurn,
  isRevealed
}: SimpleEstimationCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVote = async (value: number) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      onSubmitEstimation(value)
    } finally {
      setTimeout(() => setIsSubmitting(false), 300) // Brief delay for visual feedback
    }
  }

  if (!hasActiveTurn) {
    return (
      <div className="neu-pressed rounded-3xl p-12 text-center">
        <Timer className="w-16 h-16 text-muted-foreground mb-6 mx-auto" />
        <h3 className="text-2xl font-semibold text-muted-foreground mb-3">
          Waiting for estimation to begin...
        </h3>
        <p className="text-sm text-muted-foreground">
          A moderator will start the next round
        </p>
      </div>
    )
  }

  if (isRevealed) {
    return (
      <div className="neu-elevated rounded-3xl p-12 text-center bg-green-50">
        <CheckCircle2 className="w-16 h-16 text-green-600 mb-6 mx-auto" />
        <h3 className="text-2xl font-semibold text-green-800 mb-3">
          Estimates Revealed!
        </h3>
        <p className="text-sm text-green-700">
          Check the results above to see everyone's estimates
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">Cast your vote 👇</h3>
        
        {currentEstimation !== undefined && (
          <div className="px-4 py-2 rounded-xl neu-elevated bg-green-50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-green-800">
              {currentEstimation === -1 ? 'Unknown' : `${currentEstimation} pts`}
            </span>
          </div>
        )}
      </div>

      {/* Main Voting Options */}
      <div className="flex gap-3 max-w-3xl flex-wrap">
        {STORY_POINTS.map((point) => {
          const isSelected = currentEstimation === point.value
          const isCurrentlySubmitting = isSubmitting && currentEstimation === point.value
          
          return (
            <button
              key={point.value}
              className={`
                h-16 w-16 flex items-center justify-center relative
                transition-all duration-200 rounded-2xl font-bold text-xl
                ${isSelected 
                  ? 'bg-primary text-primary-foreground neu-pressed scale-95' 
                  : 'bg-background neu-elevated hover:neu-elevated-lg hover:scale-105'
                }
                ${isCurrentlySubmitting ? 'animate-pulse' : ''}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              onClick={() => handleVote(point.value)}
              disabled={isSubmitting}
            >
              <span>{point.label}</span>
              
              {isSelected && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center neu-elevated-sm">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}