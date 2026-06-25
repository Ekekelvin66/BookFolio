import { useId } from 'react'
import clsx from 'clsx'

const Spinner = ({ size = 'md', className = '', color = 'primary', fullPage = false, label = 'Loading' }) => {
  const gradientId = useId()

  const spinner = (
    <svg
      className={clsx('spinner-svg', `spinner-svg--${size}`, `spinner-svg--${color}`, className)}
      viewBox="0 0 50 50"
      aria-label={label}
      role="status"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop className="spinner-svg__stop-start" offset="0%" />
          <stop className="spinner-svg__stop-end" offset="100%" />
        </linearGradient>
      </defs>

      {/* faint background ring for depth */}
      <circle
        className="spinner-svg__track"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        strokeWidth="4"
      />

      {/* animated arc */}
      <circle
        className="spinner-svg__path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        strokeWidth="4"
        stroke={`url(#${gradientId})`}
      />
    </svg>
  )

  if (fullPage) {
    return (
      <div className="spinner-overlay" aria-live="polite">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default Spinner