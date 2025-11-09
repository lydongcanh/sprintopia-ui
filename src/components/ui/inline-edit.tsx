import { useState, useRef, useEffect } from 'react'
import { Button } from './button'

interface InlineEditProps {
  readonly value: string
  readonly onSave: (newValue: string) => Promise<void>
  readonly onCancel?: () => void
  readonly className?: string
  readonly inputClassName?: string
  readonly displayClassName?: string
  readonly placeholder?: string
  readonly maxLength?: number
  readonly disabled?: boolean
  readonly showEditIcon?: boolean
}

export function InlineEdit({
  value,
  onSave,
  onCancel,
  className = '',
  inputClassName = '',
  displayClassName = '',
  placeholder = 'Enter value...',
  maxLength = 100,
  disabled = false,
  showEditIcon = true,
}: Readonly<InlineEditProps>) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled) {
      setIsEditing(true)
    }
  }

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    
    const trimmedValue = editValue.trim()
    if (!trimmedValue) {
      setEditValue(value)
      setIsEditing(false)
      return
    }

    if (trimmedValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(trimmedValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
      setEditValue(value)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditValue(value)
    setIsEditing(false)
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel(e as unknown as React.MouseEvent)
    }
  }

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          className={`flex-1 px-4 py-2 bg-background rounded-xl neu-pressed focus:outline-none focus:ring-2 focus:ring-primary transition-all ${inputClassName}`}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={isSaving}
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !editValue.trim()}
          className="h-9 w-9 p-0"
        >
          {isSaving ? '...' : '✓'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
          className="h-9 w-9 p-0"
        >
          ✕
        </Button>
      </div>
    )
  }

  return (
    <button 
      type="button"
      className={`flex items-center gap-2 group text-left hover:opacity-80 transition-opacity ${className}`}
      onClick={handleStartEdit}
      disabled={disabled}
    >
      <span className={`${displayClassName}`}>{value}</span>
      {showEditIcon && (
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground text-sm">
          ✎
        </span>
      )}
    </button>
  )
}
