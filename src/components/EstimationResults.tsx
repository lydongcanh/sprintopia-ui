import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BarChart3, RotateCcw } from 'lucide-react'

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
  // Calculate statistics
  const values = estimations.map(e => e.estimation_value).sort((a, b) => a - b)
  const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  
  let median = 0
  if (values.length > 0) {
    if (values.length % 2 === 0) {
      median = (values[values.length / 2 - 1] + values[values.length / 2]) / 2
    } else {
      median = values[Math.floor(values.length / 2)]
    }
  }

  // Group estimations by value for better visualization
  const groupedEstimations = estimations.reduce((groups, estimation) => {
    const value = estimation.estimation_value
    if (!groups[value]) {
      groups[value] = []
    }
    groups[value].push(estimation)
    return groups
  }, {} as Record<number, Estimation[]>)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const formatValue = (value: number) => {
    return value === 0.5 ? '½' : value.toString()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estimation Results
          </CardTitle>
          <Button 
            onClick={onStartNewTurn} 
            disabled={isStartingNewTurn}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isStartingNewTurn ? 'Starting...' : 'New Round'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {estimations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No estimations submitted yet
          </p>
        ) : (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Votes</p>
                <p className="text-2xl font-bold text-primary">{estimations.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-2xl font-bold text-primary">{average.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Median</p>
                <p className="text-2xl font-bold text-primary">{formatValue(median)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Range</p>
                <p className="text-2xl font-bold text-primary">
                  {values.length > 0 ? `${formatValue(values[0])}-${formatValue(values.at(-1)!)}` : '-'}
                </p>
              </div>
            </div>

            {/* Grouped Results */}
            <div className="space-y-3">
              <h4 className="font-semibold">Individual Estimates</h4>
              {Object.entries(groupedEstimations)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([value, estimationsGroup]) => (
                  <div key={value} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Badge variant="outline" className="text-lg font-bold min-w-[3rem] justify-center">
                      {formatValue(Number(value))}
                    </Badge>
                    <div className="flex flex-wrap gap-2">
                      {estimationsGroup.map((estimation) => (
                        <div key={estimation.user_id} className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(estimation.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{estimation.full_name}</span>
                        </div>
                      ))}
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {estimationsGroup.length} vote{estimationsGroup.length === 1 ? '' : 's'}
                    </Badge>
                  </div>
                ))}
            </div>

            {/* Consensus Check */}
            {values.length > 1 && (
              <div className="p-4 border rounded-lg">
                {values.every(v => v === values[0]) ? (
                  <div className="text-center text-green-600">
                    <p className="font-semibold">🎉 Perfect Consensus!</p>
                    <p className="text-sm">Everyone agreed on {formatValue(values[0])} points</p>
                  </div>
                ) : (
                  <div className="text-center text-yellow-600">
                    <p className="font-semibold">⚠️ No Consensus</p>
                    <p className="text-sm">
                      Values range from {formatValue(values[0])} to {formatValue(values.at(-1)!)} points
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consider discussing the differences before starting a new round
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}