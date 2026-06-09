
import clsx from 'clsx'
import { useState } from 'react'
import { Star } from 'lucide-react'


const StarRating = ({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  className = ''
}) => {
  const [hovered, setHovered] = useState(null)

  const stars = [1, 2, 3, 4, 5]

  const displayed = hovered ?? value

  const iconSize = { sm: 16, md: 20, lg: 26 }[size]

  return (
    <div
      className={clsx(
        'star-rating',
        `star-rating--${size}`,
        readOnly && 'star-rating--readonly',
        className
      )}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`Rating: ${value} out of 5`}
    >
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={clsx(
            'star-rating__star',
            displayed >= star && 'star-rating__star--filled'
          )}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(null)}
          disabled={readOnly}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            size={iconSize}
            fill={displayed >= star ? 'currentColor' : 'none'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}

export default StarRating