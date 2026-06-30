import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import api from '../../utils/api'
import { useGenres } from '../../hooks/useGenres'

const GenreDropdown = ({ className }) => {

  const {genres}=useGenres()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div ref={dropdownRef} className={clsx('genre-dropdown', className)}>
      <button
        className="genre-dropdown__btn"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        Genres <ChevronDown size={14} className={clsx('genre-dropdown__chevron', open && 'genre-dropdown__chevron--open')} />
      </button>

      {open && (
        <div className="genre-dropdown__menu" role="listbox">
          {genres.map((genre) => (
            <Link
              key={genre.id ?? genre.name}
              to={`/genres/${encodeURIComponent(genre.name)}`}
              className="genre-dropdown__item"
              onClick={() => setOpen(false)}
            >
              {genre.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default GenreDropdown

