import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Timer } from 'lucide-react'

interface SimpleEstimationCardProps {
  readonly onSubmitEstimation: (value: number) => void
  readonly currentEstimation?: number
  readonly hasActiveTurn: boolean
  readonly isRevealed: boolean
}

// Simplified Fibonacci sequence
const STORY_POINTS = [
  { value: 0.5, label: '☕', color: '' },
  { value: 1, label: '1', color: '' },
  { value: 2, label: '2', color: '' },
  { value: 3, label: '3', color: '' },
  { value: 5, label: '5', color: '' },
  { value: 8, label: '8', color: '' },
  { value: 13, label: '13', color: '' },
  { value: 21, label: '21', color: '' },
  { value: -1, label: '?', color: '' },
]

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
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Timer className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Waiting for estimation to begin...
          </h3>
          <p className="text-sm text-muted-foreground">
            A moderator will start the next round
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isRevealed) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="text-lg font-medium text-green-800 mb-2">
            Estimates Revealed!
          </h3>
          <p className="text-sm text-green-700">
            Check the results above to see everyone's estimates
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Cast your vote 👇</h3>
        
        {currentEstimation !== undefined && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {currentEstimation === -1 ? 'Unknown' : `${currentEstimation} pts`}
          </Badge>
        )}
      </div>

      {/* Main Voting Options */}
      <div className="flex gap-1 max-w-2xl">
        {STORY_POINTS.map((point) => {
          const isSelected = currentEstimation === point.value
          const isCurrentlySubmitting = isSubmitting && currentEstimation === point.value
          
          return (
            <Button
              key={point.value}
              variant="ghost"
              size="sm"
              className={`
                h-10 w-10 flex items-center justify-center relative
                transition-all duration-200 border
                ${isSelected 
                  ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isCurrentlySubmitting ? 'animate-pulse' : ''}
                hover:scale-105
              `}
              onClick={() => handleVote(point.value)}
              disabled={isSubmitting}
            >
              <span className="text-base font-semibold">{point.label}</span>
              
              {isSelected && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}