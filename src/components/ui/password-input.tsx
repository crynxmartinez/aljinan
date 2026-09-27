'use client'
import { LocalizedError } from '@/components/localized-error'

import { useTranslation } from '@/lib/i18n/use-translation'

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
    const { t } = useTranslation()
    const [showPassword, setShowPassword] = useState(false)

    const toggleVisibility = () => {
      setShowPassword(!showPassword)
    }

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pe-10', className, error && 'border-destructive')}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={showPassword ? t.system.hidePassword : t.system.showPassword}
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
        {error && (
          <p className="text-sm text-destructive mt-1"><LocalizedError message={error} /></p>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
