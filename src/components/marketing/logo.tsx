'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  clickable?: boolean
  className?: string
}

export function Logo({ size = 'md', clickable = true, className }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  const logo = (
    <div className={cn('flex items-center gap-2 font-heading font-extrabold tracking-tight text-stone-900', sizeClasses[size], className)}>
      <span className="inline-block h-2 w-2 rounded-full bg-amber-600" aria-hidden="true" />
      TASHEEL
    </div>
  )

  if (clickable) {
    return (
      <Link href="/" className="hover:opacity-80 transition-opacity">
        {logo}
      </Link>
    )
  }

  return logo
}
