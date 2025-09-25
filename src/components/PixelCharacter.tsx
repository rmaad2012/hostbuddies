'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface PixelCharacterProps {
  character: 'beaver' | 'pigeon' | 'host'
  isAnimated?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function PixelCharacter({ character, isAnimated = false, size = 'md' }: PixelCharacterProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!isAnimated) return
    
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % 2) // Simple 2-frame animation
    }, 800)

    return () => clearInterval(interval)
  }, [isAnimated])

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  }

  const getCharacterSprite = () => {
    switch (character) {
      case 'beaver':
        return (
          <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
            <Image
              src="/beaver-samples/benny-thebeaverfullbody.png"
              alt="Benny the Beaver"
              width={size === 'sm' ? 64 : size === 'lg' ? 128 : 96}
              height={size === 'sm' ? 64 : size === 'lg' ? 128 : 96}
              className="object-contain"
              priority
            />
          </div>
        )
      
      case 'pigeon':
        return (
          <div className={`${sizeClasses[size]} relative pixel-art`}>
            {/* Pigeon sprite - gray body, business suit */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-400 to-gray-500 rounded-full"></div>
            {/* Suit jacket */}
            <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gray-800 rounded-b-full"></div>
            {/* White shirt */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white"></div>
            {/* Tie */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-6 bg-red-600"></div>
            {/* Head */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-gray-300 rounded-full"></div>
            {/* Beak */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-orange-500"></div>
            {/* Eyes */}
            <div className={`absolute top-1 left-1 w-1 h-1 bg-black rounded-full ${isAnimated && frame === 1 ? 'bg-red-500' : ''}`}></div>
            <div className={`absolute top-1 right-1 w-1 h-1 bg-black rounded-full ${isAnimated && frame === 1 ? 'bg-red-500' : ''}`}></div>
          </div>
        )
      
      default:
        return (
          <div className={`${sizeClasses[size]} relative pixel-art`}>
            {/* Generic host character */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full"></div>
            <div className={`absolute top-2 left-2 w-2 h-2 bg-black rounded-full ${isAnimated && frame === 1 ? 'h-1' : ''}`}></div>
            <div className={`absolute top-2 right-2 w-2 h-2 bg-black rounded-full ${isAnimated && frame === 1 ? 'h-1' : ''}`}></div>
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black rounded-full"></div>
          </div>
        )
    }
  }

  return (
    <div className="flex justify-center">
      {getCharacterSprite()}
    </div>
  )
}


