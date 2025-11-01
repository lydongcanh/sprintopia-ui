import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Users, Zap, Coffee, Flame } from 'lucide-react'

interface EstimationCardProps {
  readonly onSubmitEstimation: (value: number) => void
  readonly currentEstimation?: number
  readonly hasActiveTurn: boolean
  readonly participantCount: number
  readonly estimationCount: number
  readonly isRevealed: boolean
}

const ESTIMATION_VALUES = [
  { value: 0, label: '0', icon: '🚫', description: 'No effort' },
  { value: 0.5, label: '1/2', icon: '🔸', description: 'Tiny task' },
  { value: 1, label: '1', icon: '🟡', description: 'Very small' },
  { value: 2, label: '2', icon: '🟠', description: 'Small' },
  { value: 3, label: '3', icon: '🔵', description: 'Medium small' },
  { value: 5, label: '5', icon: '🟢', description: 'Medium' },
  { value: 8, label: '8', icon: '🟣', description: 'Large' },
  { value: 13, label: '13', icon: '🔴', description: 'Very large' },
  { value: 21, label: '21', icon: '🚀', description: 'Huge' },
  { value: 34, label: '34', icon: '🌟', description: 'Epic' },
  { value: 55, label: '55', icon: '🦄', description: 'Legendary' },
  { value: 89, label: '89', icon: '🌈', description: 'Mythical' },
  { value: -1, label: '?', icon: '❓', description: 'Unknown' },
  { value: -2, label: '☕', icon: '☕', description: 'Break time' },
]

export function EstimationCard({
  onSubmitEstimation,
  currentEstimation,
  hasActiveTurn,
  participantCount,
  estimationCount,
  isRevealed
}: EstimationCardProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(currentEstimation || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (value: number) => {
    setIsSubmitting(true)
    setSelectedValue(value)
    try {
      onSubmitEstimation(value)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getProgressPercentage = () => {
    if (participantCount === 0) return 0
    return Math.min((estimationCount / participantCount) * 100, 100)
  }

  const getProgressColor = () => {
    const percentage = getProgressPercentage()
    if (percentage === 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-gray-300'
  }

  if (!hasActiveTurn) {
    return (
      <Card className="w-full max-w-4xl mx-auto border-dashed border-2 border-muted-foreground/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No Active Estimation
          </h3>
          <p className="text-sm text-muted-foreground">
            Waiting for an estimation turn to begin...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-2 border-primary/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Story Point Estimation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select your estimate for this story
              </p>
            </div>
          </div>
          
          {currentEstimation !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Voted: {(() => {
                if (currentEstimation === -1) return '?'
                if (currentEstimation === -2) return '☕'
                return currentEstimation
              })()}
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Progress: {estimationCount} of {participantCount} voted</span>
            </div>
            <span className="font-medium">{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {isRevealed ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Estimates Revealed!</h3>
            <p className="text-muted-foreground">
              Check the results below to see everyone's estimates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {ESTIMATION_VALUES.map((item) => {
              const isSelected = selectedValue === item.value
              const isCurrentEstimation = currentEstimation === item.value
              
              return (
                <Button
                  key={item.value}
                  variant={isSelected || isCurrentEstimation ? "default" : "outline"}
                  size="lg"
                  className={`
                    relative h-20 flex flex-col items-center justify-center gap-1 text-center
                    transition-all duration-200 hover:scale-105 hover:shadow-md
                    ${isSelected || isCurrentEstimation 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                      : 'hover:bg-accent'
                    }
                    ${isSubmitting && isSelected ? 'animate-pulse' : ''}
                  `}
                  onClick={() => handleSubmit(item.value)}
                  disabled={isSubmitting}
                  title={item.description}
                >
                  <span className="text-xl mb-1" aria-label={item.description}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-bold">{item.label}</span>
                  
                  {isCurrentEstimation && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                  )}
                </Button>
              )
            })}
          </div>
        )}

        {/* Quick actions */}
        {!isRevealed && (
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => handleSubmit(-2)}
              disabled={isSubmitting}
            >
              <Coffee className="w-4 h-4" />
              Need a break
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => handleSubmit(-1)}
              disabled={isSubmitting}
            >
              <Flame className="w-4 h-4" />
              Too complex
            </Button>
          </div>
        )}

        {/* Helpful tip */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 <strong>Tip:</strong> Fibonacci sequence helps maintain relative sizing. 
            Hover over cards to see descriptions.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}