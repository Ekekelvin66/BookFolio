import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Star, Search, BookMarked, Users, ChevronDown } from 'lucide-react'
import { useHome } from '../hooks/useHome'
import Spinner from '../components/ui/Spinner'
import BookCard from '../components/book/BookCard'
import Logo from '../components/ui/Logo'
import LandingFooter from '../components/layout/LandingFooter'
import clsx from 'clsx'
import BookSearchCombobox from '../components/ui/BookSearchbox'
import GenreDropdown from '../components/ui/Genredropdown'
import Skeleton from '../components/ui/Skeleton'

const AUTHOR_OF_MONTH = {
  name: 'Chimamanda Ngozi Adichie',
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Chimamanda_Ngozi_Adichie_2015.jpg/440px-Chimamanda_Ngozi_Adichie_2015.jpg',
  quote: 'The single story creates stereotypes, and the problem with stereotypes is not that they are untrue, but that they are incomplete.',
  bio: 'Nigerian author of novels, nonfiction and short stories. Known for works exploring the African experience.',
  works: ['Purple Hibiscus', 'Half of a Yellow Sun', 'Americanah', 'We Should All Be Feminists'],
}

const JOURNEY_STEPS = [
  {
    icon: Search,
    title: 'Explore',
    description: 'Discover books from our community and the Google Books library spanning every genre and era.',
  },
  {
    icon: BookMarked,
    title: 'Curate',
    description: 'Build your personal shelf — track what you are reading, have finished, and want to read next.',
  },
  {
    icon: Users,
    title: 'Contribute',
    description: 'Write reviews, join book clubs, and connect with fellow readers who share your literary taste.',
  },
]

const LandingPage = () => {
  const navigate = useNavigate()
  const { getGuestHomeEssential, getGuestHomeExtended, loading, loadingExtended } = useHome()

  const [clubs]=useState([])
  const [communityBooks, setCommunityBooks] = useState([])
  const [trendingBooks, setTrendingBooks] = useState([])
  const [trendingGenre, setTrendingGenre] = useState('')
  const [bestsellers, setBestsellers] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const essential = await getGuestHomeEssential()
      if (essential.success) {
        setCommunityBooks(essential.data.communityBooks ?? [])
      }

      const extended = await getGuestHomeExtended()
      if (extended.success) {
        setTrendingBooks(extended.data.trendingBooks ?? [])
        setTrendingGenre(extended.data.trendingGenre ?? '')
        setBestsellers(extended.data.bestsellers ?? [])
      }
    }
    fetchData()
  }, [])
  

  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleSearch = (query) => {
    navigate(`/search?query=${encodeURIComponent(query)}`)
  }

  const featuredBook = communityBooks[0] ?? null
  const secondaryBooks = communityBooks.slice(1, 3)

  if (loading) return <Spinner />

  return (
    <div className="landing">

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


      <section className="landing-hero">
        <p className="landing-hero__eyebrow">For the modern scholar</p>
        <h1 className="landing-hero__title">
          A sanctuary for <em>devoted</em> readers
        </h1>
        <p className="landing-hero__sub">
          Discover, curate, and discuss the books that shape your thinking.
          Join a community of readers who care deeply about literature.
        </p>
        <div className="landing-hero__actions">
          <Link to="/register" className="landing-hero__btn landing-hero__btn--primary">
            Start Reading <ArrowRight size={16} />
          </Link>
          <Link to="/search" className="landing-hero__btn landing-hero__btn--ghost">
            Explore Books
          </Link>
        </div>
      </section>

      {communityBooks.length > 0 && (
        <section className="landing-section">
          <div className="landing-section__header">
            <div className='landing-section__header-left'>
                <h2 className="landing-section__title">Community Favorites</h2>
                <p className="landing-section__sub">Books our readers love most</p>
            </div>
            <div className='landing-section__header-right'>
            <Link to='/books' className='landing-section__header-right__btn'>
            View All
            </Link>
            </div>
          </div>

          <div className="landing-bento">
            {featuredBook && (
              <div className="landing-bento__featured">
                <img
                  src={featuredBook.cover_url}
                  alt={featuredBook.title}
                  className="landing-bento__cover"
                />
                <div className="landing-bento__info">
                  <span className="landing-bento__genre">{featuredBook.genre}</span>
                  <h3 className="landing-bento__book-title">{featuredBook.title}</h3>
                  <p className="landing-bento__author">{featuredBook.author}</p>
                  {featuredBook.avg_rating && (
                    <div className="landing-bento__rating">
                      <Star size={14} />
                      <span>{featuredBook.avg_rating}</span>
                      <span className="landing-bento__review-count">
                        ({featuredBook.review_count} reviews)
                      </span>
                    </div>
                  )}
                  <Link to={`/books/${featuredBook.id}`} className="landing-bento__btn">
                    View Book <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}

            <div className="landing-bento__stack">
              {secondaryBooks.map((book) => (
                <Link
                  key={book.id}
                  to={`/books/${book.id}`}
                  className="landing-bento__secondary"
                >
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="landing-bento__secondary-cover"
                  />
                  <div className="landing-bento__secondary-info">
                    <p className="landing-bento__secondary-title">{book.title}</p>
                    <p className="landing-bento__secondary-author">{book.author}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      
      {loadingExtended ? (
          <section className="landing-section landing-section--alt">
            <Skeleton className="h-10 w-64 mb-4" />
            <div className="landing-strip">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 w-40" />)}
            </div>
          </section>
      ) : trendingBooks.length > 0 && (
        <section className="landing-section landing-section--alt">
          <div className="landing-section__header">
            <h2 className="landing-section__title">Trending in {trendingGenre}</h2>
            <p className="landing-section__sub">What readers are picking up right now</p>
          </div>
          <div className="landing-strip">
            {trendingBooks.map((book, i) => (
              <BookCard key={book.googleBooksId ?? i} book={book} variant="minimal" />
            ))}
          </div>
        </section>
      )}

      {loadingExtended ? (
          <section className="landing-section">
              <Skeleton className="h-10 w-64 mb-4" />
              <div className="landing-bestsellers">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full mb-2" />)}
              </div>
          </section>
      ) : bestsellers.length > 0 && (
        <section className="landing-section">
          <div className="landing-section__header">
            <h2 className="landing-section__title">Global Bestsellers</h2>
            <p className="landing-section__sub">A definitive Ranking of world Literature</p>
          </div>

          <div className="landing-bestsellers">
            {bestsellers.slice(0, 8).map((book, i) => (
              <Link
                key={book.googleBooksId ?? i}
                to={`/books/${book.googleBooksId ?? book.id}`}
                className="landing-bestsellers__item"
              >
                <span className="landing-bestsellers__rank">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <img
                  src={book.cover_url ?? book.cover}
                  alt={book.title}
                  className="landing-bestsellers__cover"
                />
                <div className="landing-bestsellers__info">
                  <p className="landing-bestsellers__title">{book.title}</p>
                  <p className="landing-bestsellers__author">{book.author}</p>
                  {book.genre && (
                    <span className="landing-bestsellers__genre">{book.genre}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}


      <section className="landing-section landing-section--alt">
        <div className="landing-section__header">
          <h2 className="landing-section__title">Author of the Month</h2>
        </div>

        <div className="landing-author">
          <div className="landing-author__left">
          </div>
          <div className="landing-author__right">
            <h3 className="landing-author__name">{AUTHOR_OF_MONTH.name}</h3>
            <p className="landing-author__bio">{AUTHOR_OF_MONTH.bio}</p>
            <blockquote className="landing-author__quote">
              "{AUTHOR_OF_MONTH.quote}"
            </blockquote>
            <div className="landing-author__works">
              <p className="landing-author__works-label">ESSENTIAL WORKS</p>
              <div className="landing-author__works-list">
                {AUTHOR_OF_MONTH.works.map((work) => (
                  <Link
                    key={work}
                    to={`/search?query=${encodeURIComponent(work)}`}
                    className="landing-author__work"
                  >
                    {work}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {clubs.length > 0 && (
        <section className="landing-section">
          <div className="landing-section__header">
            <h2 className="landing-section__title">Active Literary Circles</h2>
            <p className="landing-section__sub">
              Join readers who are passionate about the same books
            </p>
          </div>
          <div className="landing-clubs">
            {clubs.map((club) => (
              <div key={club.id} className="landing-clubs__card">
                <div className="landing-clubs__cover">
                  {club.cover_url
                    ? <img src={club.cover_url} alt={club.name} />
                    : <Users size={24} />
                  }
                </div>
                <div className="landing-clubs__info">
                  <p className="landing-clubs__name">{club.name}</p>
                  {club.current_book_title && (
                    <p className="landing-clubs__book">
                      Currently Reading: <em>{club.current_book_title}</em>
                    </p>
                  )}
                  <p className="landing-clubs__members">
                    {club.member_count} members
                  </p>
                </div>
                <Link to={`/register?redirect=/clubs/${club.id}`} className="landing-clubs__join">
                  Join Club
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}


      <section className="landing-section">
        <div className="landing-section__header">
          <h2 className="landing-section__title">The Scholar's Journey</h2>
          <p className="landing-section__sub">A Three-step guide to mastering the archive</p>
        </div>

        <div className="landing-journey">
          {JOURNEY_STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="landing-journey__step">
                <div className="landing-journey__icon">
                  <Icon size={24} />
                </div>
                <span className="landing-journey__number">0{i + 1}</span>
                <h3 className="landing-journey__title">{step.title}</h3>
                <p className="landing-journey__desc">{step.description}</p>
              </div>
            )
          })}
        </div>
      </section>
      
        <section className="landing-section landing-section--alt">
        <div className="landing-cta">
            <div className="landing-cta__card landing-cta__card--primary">
                <h3 className="landing-cta__title">Connect with Readers</h3>
                <p className="landing-cta__desc">
                    Message fellow scholars, share recommendations and build 
                    your reading network with like-minded readers.
                </p>
            <Link to="/register" className="landing-cta__btn landing-cta__btn--light">
                Join the Community <ArrowRight size={14} />
            </Link>
            </div>
        </div>
        </section>

      <LandingFooter />
    </div>
  )
}

export default LandingPage
