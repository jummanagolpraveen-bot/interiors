'use client'

import { useState, useRef, useEffect } from 'react'

export function BeforeAfter({ beforeImage, afterImage }: { beforeImage: string, afterImage: string }) {
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [isFullscreen])

  return (
    <div className={`relative flex flex-col items-center justify-center ${isFullscreen ? 'fixed inset-0 z-50 bg-black p-8' : 'w-full'}`}>
      {isFullscreen && (
        <button 
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-[60] bg-white text-black p-2 rounded-full font-bold shadow-lg hover:bg-gray-200"
        >
          Close
        </button>
      )}
      <div 
        ref={containerRef} 
        className={`relative w-full overflow-hidden rounded-lg select-none bg-gray-100 ${isFullscreen ? 'h-full max-h-[90vh]' : 'aspect-video'}`}
      >
        <img src={afterImage} alt="After" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <div 
          className="absolute inset-y-0 left-0 overflow-hidden bg-gray-100 border-r-2 border-white"
          style={{ width: `${sliderPos}%` }}
        >
          <img src={beforeImage} alt="Before" className="absolute top-0 left-0 h-full object-cover" style={{ width: containerWidth || '100%', maxWidth: 'none' }} draggable={false} />
        </div>
        <input 
          type="range" 
          min={0} 
          max={100} 
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
        />
        <div 
          className="absolute inset-y-0 w-1 bg-white shadow cursor-ew-resize pointer-events-none"
          style={{ left: `calc(${sliderPos}% - 2px)` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
            <div className="flex gap-1">
              <div className="w-0.5 h-3 bg-gray-400"></div>
              <div className="w-0.5 h-3 bg-gray-400"></div>
            </div>
          </div>
        </div>
      </div>
      {!isFullscreen && (
        <button onClick={() => setIsFullscreen(true)} className="mt-2 text-sm text-gray-500 hover:text-black">
          View Fullscreen
        </button>
      )}
    </div>
  )
}
