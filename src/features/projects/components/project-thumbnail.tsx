import { useState } from 'react'
import { cn } from '@/lib/utils'
import { languageDotClass } from './language-colors'

type ProjectThumbnailProps = {
  thumbnailDataUri: string | null
  language: string | null
  name: string
  className?: string
}

export function ProjectThumbnail({
  thumbnailDataUri,
  language,
  name,
  className,
}: ProjectThumbnailProps) {
  const [hasError, setHasError] = useState(false)

  const showImage = thumbnailDataUri && !hasError

  return (
    <div
      className={cn(
        'aspect-[5/2] w-full overflow-hidden border-b bg-muted',
        className
      )}
    >
      {showImage ? (
        <img
          src={thumbnailDataUri}
          alt=''
          className='size-full object-cover'
          onError={() => setHasError(true)}
        />
      ) : (
        <BrutalistPlaceholder language={language} name={name} />
      )}
    </div>
  )
}

function BrutalistPlaceholder({
  language,
  name,
}: {
  language: string | null
  name: string
}) {
  const colorClass = language ? languageDotClass(language) : 'bg-muted'
  const glyph = name.charAt(0).toUpperCase()

  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center',
        colorClass
      )}
    >
      {/* Grid texture overlay */}
      <div
        className='absolute inset-0'
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.12) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />
      {/* Center glyph */}
      <span className='font-mono text-5xl font-bold text-white/80 mix-blend-overlay'>
        {glyph}
      </span>
      {/* Corner language label */}
      <span className='absolute bottom-0 left-0 bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-background'>
        {language ?? 'UNKNOWN'}
      </span>
    </div>
  )
}
