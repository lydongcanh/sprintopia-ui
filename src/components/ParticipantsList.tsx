import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX } from "lucide-react"

export interface Participant {
  user_id: string
  full_name: string
  email: string
  joined_at?: string
}

interface ParticipantsListProps {
  readonly participants: Participant[]
  readonly currentUserId?: string
  readonly className?: string
}

export function ParticipantsList({ participants, currentUserId, className = '' }: ParticipantsListProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (userId: string) => {
    // Generate a consistent color based on user ID
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500'
    ]
    const index = userId.split('').reduce((acc, char) => acc + (char.codePointAt(0) || 0), 0) % colors.length
    return colors[index]
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">
            <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No participants yet</p>
            <p className="text-sm">Share the session link to invite others</p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant) => (
              <div
                key={participant.user_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={participant.full_name} />
                  <AvatarFallback className={`text-white text-sm font-medium ${getAvatarColor(participant.user_id)}`}>
                    {getInitials(participant.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {participant.full_name}
                      {participant.user_id === currentUserId && (
                        <span className="text-muted-foreground ml-1">(You)</span>
                      )}
                    </p>
                    {participant.user_id === currentUserId && (
                      <Badge variant="secondary" className="text-xs">
                        <UserCheck className="h-3 w-3 mr-1" />
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {participant.email}
                  </p>
                </div>

                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full" title="Online" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}