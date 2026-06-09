import clsx from 'clsx'

const Spinner = ({ size = 'md', className = '', color = 'primary' }) => {
  return (
    <svg
      className={clsx('spinner-svg', `spinner-svg--${size}`, `spinner-svg--${color}`, className)}
      viewBox="0 0 50 50"
      aria-label="Loading"
      role="status"
    >
      <circle
        className="spinner-svg__path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        strokeWidth="4"
      />
    </svg>
  )
}

export default Spinner
