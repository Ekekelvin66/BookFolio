import clsx from 'clsx'

const StatsCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  className,
}) => {
  return (
    <div className={clsx('stats-card', `stats-card--${variant}`, className)}>
      {Icon && (
        <div className="stats-card__icon">
          <Icon size={18} />
        </div>
      )}
      <div className="stats-card__body">
        <p className="stats-card__label">{label}</p>
        <p className="stats-card__value">{value ?? '—'}</p>
        {subtext && (
          <p className="stats-card__subtext">{subtext}</p>
        )}
      </div>
    </div>
  )
}

export default StatsCard