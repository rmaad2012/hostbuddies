'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'quest'
  size?: 'sm' | 'md' | 'lg'
}

export default function PixelButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}: PixelButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-800'
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white border-gray-800'
      case 'quest':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-800'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-800'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-xs'
      case 'md':
        return 'px-4 py-2 text-sm'
      case 'lg':
        return 'px-6 py-3 text-base'
      default:
        return 'px-4 py-2 text-sm'
    }
  }

  return (
    <button
      className={`
        font-mono font-bold rounded-none border-2 
        transition-all duration-150 
        transform active:scale-95 
        shadow-lg hover:shadow-xl
        disabled:opacity-50 disabled:cursor-not-allowed
        pixel-button
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))'
      }}
      {...props}
    >
      {children}
    </button>
  )
}


