import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { Loader2, Wifi, WifiOff } from 'lucide-react'

interface ServerStatusProps {
  readonly className?: string
}

export function ServerStatus({ className = '' }: ServerStatusProps) {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkServerHealth = async () => {
    setStatus('checking')
    try {
      const result = await api.healthCheck()
      setStatus(result.status)
      setResponseTime(result.response_time || null)
      setLastChecked(new Date())
    } catch {
      setStatus('offline')
      setResponseTime(null)
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    // Check immediately on mount
    checkServerHealth()
    
    // Check every 30 seconds
    const interval = setInterval(checkServerHealth, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'offline':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'checking':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <Wifi className="h-3 w-3" />
      case 'offline':
        return <WifiOff className="h-3 w-3" />
      case 'checking':
        return <Loader2 className="h-3 w-3 animate-spin" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return responseTime ? `Online (${responseTime}ms)` : 'Online'
      case 'offline':
        return 'Server Offline'
      case 'checking':
        return 'Checking...'
    }
  }

  const formatLastChecked = () => {
    if (!lastChecked) return ''
    return `Last checked: ${lastChecked.toLocaleTimeString()}`
  }

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 ${className}`}
      title={formatLastChecked()}
    >
      <button 
        type="button"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium shadow-sm cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${getStatusColor()}`}
        onClick={checkServerHealth}
        aria-label={`Server status: ${getStatusText()}. Click to refresh.`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </button>
    </div>
  )
}