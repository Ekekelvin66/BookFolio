import clsx from 'clsx'

const BAR_COLORS = [
  'genre-chart__bar--purple',
  'genre-chart__bar--teal',
  'genre-chart__bar--coral',
  'genre-chart__bar--amber',
  'genre-chart__bar--blue',
  'genre-chart__bar--muted',
]

const GenreChart = ({ genres = [], className }) => {
  if (!genres.length) {
    return (
      <div className={clsx('genre-chart genre-chart--empty', className)}>
        <p className="genre-chart__empty-text">No genre data yet. Start reviewing books!</p>
      </div>
    )
  }

  const sorted = [...genres].sort((a, b) => b.book_count - a.book_count)
  const top = sorted.slice(0, 5)
  const rest = sorted.slice(5)

  const otherCount = rest.reduce((sum, g) => sum + Number(g.book_count), 0)
  const otherPct = rest.reduce((sum, g) => sum + Number(g.percentage), 0)

  const display = otherCount > 0
    ? [...top, { name: 'Other', book_count: otherCount, percentage: otherPct.toFixed(1) }]
    : top

  return (
    <div className={clsx('genre-chart', className)}>
      <p className="genre-chart__title">Genre Breakdown</p>
      <div className="genre-chart__rows">
        {display.map((genre, i) => (
          <div key={genre.name} className="genre-chart__row">
            <span className="genre-chart__name">{genre.name}</span>
            <div className="genre-chart__track">
              <div
                className={clsx('genre-chart__bar', BAR_COLORS[i] ?? BAR_COLORS[BAR_COLORS.length - 1])}
                style={{ width: `${Math.min(Number(genre.percentage), 100)}%` }}
              />
            </div>
            <span className="genre-chart__pct">{genre.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GenreChart