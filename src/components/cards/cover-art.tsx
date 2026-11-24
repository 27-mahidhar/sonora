import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CoverArtProps {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  rounded?: string
}

/**
 * Artwork primitive.
 * JPGs go through `next/image` (AVIF/WebP, lazy, sized); SVG covers are
 * emitted as-is since the optimiser does not transform them.
 */
export function CoverArt({
  src,
  alt,
  className,
  sizes = '(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 15vw',
  priority = false,
  rounded = 'rounded-xl',
}: CoverArtProps) {
  const isSvg = src.endsWith('.svg')

  return (
    <div className={cn('art art-shadow', rounded, className)}>
      {isSvg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      )}
    </div>
  )
}
