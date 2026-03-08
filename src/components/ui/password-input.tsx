'use client'

import { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  showStrength?: boolean
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, showStrength, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const toggleVisibility = () => {
      setShowPassword(!showPassword)
    }

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className, error && 'border-destructive')}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
