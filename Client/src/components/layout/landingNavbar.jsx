import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Logo from '../ui/Logo'
import BookSearchCombobox from '../ui/BookSearchbox'
import Button from '../ui/Button'

const LandingNavbar = ({ className }) => {
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMobileSearchOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSearch = (query) => {
    setIsMobileSearchOpen(false)
    navigate(`/search?query=${encodeURIComponent(query)}`)
  }

  return (
    <>
      <header className="landing-nav">
      
              <Logo className="landing-nav__logo-normal" />
      
              <BookSearchCombobox
                placeholder="Search for books..."
                onSearch={handleSearch}
                className="landing-nav__search"
              />
      
              <div className="landing-nav__right">
                <Link to="/login" className="landing-nav__link">Sign In</Link>
                <Link to="/register" className="landing-nav__cta">Get Started</Link>
              </div>
      
              <div className="landing-nav__top">
                <div className="landing-nav__top-left">
                  <button
                    className="landing-nav__search-toggle"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    aria-label="Search"
                  >
                    <Search size={20} />
                  </button>
                </div>
                <div className="landing-nav__top-center">
                  <Logo className="landing-nav__logo" />
                </div>
                <div className="landing-nav__top-right">
                  <Link to="/login" className="landing-nav__link">Sign In</Link>
                </div>
              </div>
      
              <div className={clsx("landing-nav__search-container", isSearchOpen && "is-open")}>
                <BookSearchCombobox
                  placeholder="Search for books..."
                  onSearch={handleSearch}
                  className="landing-nav__search"
                />
              </div>
      
              <div className="landing-nav__bottom">
                <Link to="/register" className="landing-nav__cta">Get Started</Link>
              </div>
      
            </header>

      {isMobileSearchOpen && (
        <div className="navbar__mobile-search-row">
          <div className="navbar__mobile-search-inner">
            <BookSearchCombobox placeholder="Search for books..." onSearchSubmit={handleSearch} />
            <button onClick={() => setIsMobileSearchOpen(false)} className="navbar__mobile-search-cancel">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default LandingNavbar