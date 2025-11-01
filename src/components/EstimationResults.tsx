import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RotateCcw, Target, TrendingUp } from 'lucide-react'

interface Estimation {
  user_id: string
  full_name: string
  email: string
  estimation_value: number
}

interface EstimationResultsProps {
  readonly estimations: Estimation[]
  readonly onStartNewTurn: () => void
  readonly isStartingNewTurn?: boolean
}

export function EstimationResults({ estimations, onStartNewTurn, isStartingNewTurn = false }: EstimationResultsProps) {
  // Calculate simple statistics
  const values = estimations.map(e => e.estimation_value).filter(v => v >= 0).sort((a, b) => a - b)
  const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  
  const formatValue = (value: number) => {
    return value === 0.5 ? '½' : value.toString()
  }

  // Check for consensus (all values within 1-2 points of each other)
  const hasConsensus = values.length > 0 && (values.at(-1)! - values[0] <= 2)

  return (
    <Card className="text-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
      <CardContent className="py-8 space-y-6">
        {estimations.length === 0 ? (
          <div className="space-y-4">
            <div className="text-4xl">🤔</div>
            <p className="text-muted-foreground">No votes submitted</p>
          </div>
        ) : (
          <>
            {/* Main Result */}
            <div className="space-y-4">
              <div className="text-6xl">
                {hasConsensus ? '🎯' : '🤝'}
              </div>
              
              {hasConsensus ? (
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-green-600">Great Consensus!</h3>
                  <div className="flex items-center justify-center gap-2 text-3xl font-bold text-primary">
                    <Target className="w-8 h-8" />
                    {formatValue(Math.round(average))} points
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-orange-600">Let's Discuss!</h3>
                  <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
                    <TrendingUp className="w-5 h-5" />
                    Range: {formatValue(values[0])} - {formatValue(values.at(-1)!)} points
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Different perspectives - time to align! 💬
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <p className="text-muted-foreground">Votes</p>
                <p className="font-bold text-lg">{estimations.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Average</p>
                <p className="font-bold text-lg">{average.toFixed(1)}</p>
              </div>
            </div>
          </>
        )}

        {/* Next Action */}
        <Button 
          onClick={onStartNewTurn} 
          disabled={isStartingNewTurn}
          size="lg"
          className="w-full h-12 text-lg"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          {isStartingNewTurn ? 'Starting...' : '🚀 Start Next Round'}
        </Button>
      </CardContent>
    </Card>
  )
}