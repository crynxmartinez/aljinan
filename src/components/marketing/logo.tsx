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
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  const logo = (
    <div className={cn('font-bold text-gray-900', sizeClasses[size], className)}>
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
