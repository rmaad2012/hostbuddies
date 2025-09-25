'use client'

import { ReactNode } from 'react'

interface SpeechBubbleProps {
  children: ReactNode
  position?: 'left' | 'right'
  isTyping?: boolean
  className?: string
}

export default function SpeechBubble({ 
  children, 
  position = 'left', 
  isTyping = false,
  className = '' 
}: SpeechBubbleProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Speech bubble */}
      <div className={`
        relative bg-white border-4 border-black rounded-none p-4 shadow-lg
        pixel-speech-bubble
        ${position === 'right' ? 'ml-8' : 'mr-8'}
      `}>
        {/* Pixel-style border effect */}
        <div className="absolute -inset-1 bg-black -z-10" style={{
          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
        }}></div>
        
        {/* Content */}
        <div className="relative z-10">
          {isTyping ? (
            <div className="flex items-center gap-1">
              <span className="text-black font-mono text-sm">Typing</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-black animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-black animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-black animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : (
            <div className="text-black font-mono text-sm leading-relaxed">
              {children}
            </div>
          )}
        </div>
        
        {/* Speech bubble tail */}
        <div className={`
          absolute top-6 w-0 h-0
          ${position === 'left' 
            ? '-left-4 border-t-8 border-r-8 border-b-8 border-l-0 border-t-transparent border-r-black border-b-transparent border-l-transparent'
            : '-right-4 border-t-8 border-l-8 border-b-8 border-r-0 border-t-transparent border-l-black border-b-transparent border-r-transparent'
          }
        `}></div>
        
        {/* Tail inner part (white) */}
        <div className={`
          absolute top-6 w-0 h-0
          ${position === 'left'
            ? '-left-3 border-t-6 border-r-6 border-b-6 border-l-0 border-t-transparent border-r-white border-b-transparent border-l-transparent'
            : '-right-3 border-t-6 border-l-6 border-b-6 border-r-0 border-t-transparent border-l-white border-b-transparent border-r-transparent'
          }
        `}></div>
      </div>
    </div>
  )
}


