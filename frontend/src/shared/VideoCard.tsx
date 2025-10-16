import { useRef, useState } from 'react'

interface VideoCardProps {
  src: string
  alt: string
  thumbnail: string
}

export function VideoCard({ src, alt, thumbnail }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  return (
    <div 
      className="relative w-full overflow-hidden bg-black"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        className="w-full h-auto"
        autoPlay
        loop
        muted
        playsInline
        poster={thumbnail}
      >
        <source src={src} type="video/mp4" />
        Il tuo browser non supporta il tag video.
      </video>
      
      {/* Overlay indicatore pausa (opzionale) */}
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 transition-opacity">
          <div className="w-16 h-16 flex items-center justify-center bg-white bg-opacity-90 rounded-full">
            <svg 
              className="w-8 h-8 text-black" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

