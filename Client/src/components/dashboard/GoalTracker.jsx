import clsx from 'clsx'

const getMessage = (pct) => {
  if (pct >= 100) return 'Goal achieved! 🎉'
  if (pct >= 75)  return 'Almost there, keep going!'
  if (pct >= 50)  return 'Over halfway there!'
  if (pct >= 25)  return 'Making great progress.'
  return 'Just getting started.'
}

const GoalTracker = ({ current = 0, goal = 0, className }) => {
  const safeGoal = goal || 1
  const pct = Math.min(Math.round((current / safeGoal) * 100), 100)
  const achieved = pct >= 100

  return (
    <div className={clsx('goal-tracker', achieved && 'goal-tracker--achieved', className)}>
      <div className="goal-tracker__header">
        <p className="goal-tracker__label">Yearly Reading Goal</p>
        <span className="goal-tracker__count">
          {current} <span className="goal-tracker__count-sep">/</span> {goal}
        </span>
      </div>

      <div className="goal-tracker__track">
        <div
          className="goal-tracker__fill"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="goal-tracker__footer">
        <p className="goal-tracker__message">{getMessage(pct)}</p>
        <span className="goal-tracker__pct">{pct}%</span>
      </div>
    </div>
  )
}

export default GoalTracker