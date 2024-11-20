'use client'

import { DollarSign } from "lucide-react"
import Link from "next/link"
import { useTheme } from 'next-themes'

interface LogoProps {
  className?: string
  showIcon?: boolean
}

export function Logo({ className = "", showIcon = true }: LogoProps) {
  const { theme } = useTheme()

  const headerGradientClass = theme === 'dark'
    ? 'from-[#FFDAB9] via-[#87CEEB] to-[#E6E6FA]'
    : 'from-[#FF6B6B] via-[#4ECDC4] to-[#45B7D1]'

  return (
    <Link className={`flex items-center justify-center ${className}`} href="/">
      {showIcon && <DollarSign className="h-6 w-6 text-primary" />}
      <span className={`ml-2 text-2xl font-bold bg-gradient-to-r ${headerGradientClass} text-transparent bg-clip-text bg-300% animate-gradient`}>
        SplitEase
      </span>
    </Link>
  )
}
