'use client'

interface PixelProgressBarProps {
  progress: number
  maxProgress: number
  label?: string
  color?: 'blue' | 'green' | 'slate' | 'gold'
  showText?: boolean
}

export default function PixelProgressBar({ 
  progress, 
  maxProgress, 
  label = 'Progress',
  color = 'blue',
  showText = true 
}: PixelProgressBarProps) {
  const percentage = Math.min((progress / maxProgress) * 100, 100)
  
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-700',
          shadow: 'shadow-blue-400'
        }
      case 'green':
        return {
          bg: 'bg-green-500',
          border: 'border-green-700',
          shadow: 'shadow-green-400'
        }
      case 'slate':
        return {
          bg: 'bg-slate-500',
          border: 'border-slate-700',
          shadow: 'shadow-slate-400'
        }
      case 'gold':
        return {
          bg: 'bg-yellow-500',
          border: 'border-yellow-700',
          shadow: 'shadow-yellow-400'
        }
      default:
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-700',
          shadow: 'shadow-blue-400'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div className="pixel-progress-container">
      {showText && (
        <div className="flex justify-between items-center mb-2">
          <span className="font-mono text-sm font-bold text-white drop-shadow-lg">
            {label}
          </span>
          <span className="font-mono text-xs font-bold text-white drop-shadow-lg">
            {progress}/{maxProgress}
          </span>
        </div>
      )}
      
      {/* Outer container */}
      <div className="relative w-full h-4 bg-black border-2 border-gray-800 rounded-none">
        {/* Background */}
        <div className="absolute inset-0 bg-gray-700"></div>
        
        {/* Progress fill */}
        <div 
          className={`
            absolute top-0 left-0 h-full transition-all duration-500 ease-out
            ${colors.bg} ${colors.border} border-r-2
          `}
          style={{ 
            width: `${percentage}%`,
            boxShadow: percentage > 0 ? `inset 0 2px 0 rgba(255,255,255,0.3)` : 'none'
          }}
        >
          {/* Shine effect */}
          {percentage > 0 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white opacity-40"></div>
          )}
        </div>
        
        {/* Progress segments (like classic RPG health bars) */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: maxProgress }, (_, i) => (
            <div 
              key={i}
              className="flex-1 border-r border-black last:border-r-0"
            />
          ))}
        </div>
      </div>
      
      {/* Completion sparkle effect */}
      {percentage === 100 && (
        <div className="absolute -top-2 right-0 text-yellow-400 animate-pulse">
          ✨
        </div>
      )}
    </div>
  )
}


