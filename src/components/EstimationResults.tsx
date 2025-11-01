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
    <Card className="border">
      <CardContent className="py-8 space-y-6 text-center">
        {estimations.length === 0 ? (
          <div className="space-y-4">
            <div className="text-4xl">🤔</div>
            <p className="text-muted-foreground">No votes submitted</p>
          </div>
        ) : (
          <>
            {/* Main Result */}
            <div className="space-y-4">
              {hasConsensus ? (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-green-600">Great Consensus!</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Target className="w-6 h-6 text-primary" />
                    <span className="text-4xl font-bold text-primary">{formatValue(Math.round(average))}</span>
                    <span className="text-lg text-muted-foreground">points</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-orange-600">Let's Discuss</h3>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-lg">Range: {formatValue(values[0])} - {formatValue(values.at(-1)!)} points</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex justify-center gap-12 text-sm border-t pt-4">
              <div>
                <p className="text-muted-foreground mb-1">Votes</p>
                <p className="font-semibold text-xl">{estimations.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Average</p>
                <p className="font-semibold text-xl">{average.toFixed(1)}</p>
              </div>
            </div>
          </>
        )}

        {/* Next Action */}
        <Button 
          onClick={onStartNewTurn} 
          disabled={isStartingNewTurn}
          size="lg"
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {isStartingNewTurn ? 'Starting...' : 'Start Next Round'}
        </Button>
      </CardContent>
    </Card>
  )
}