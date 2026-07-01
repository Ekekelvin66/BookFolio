import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useAuthContext } from '../context/AuthContext'
import { useUsernameAvailability } from '../hooks/useUsernameAvailability'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import PageWrapper from '../components/layout/PageWrapper'
import Input from '../components/ui/Input'
import BookSearchCombobox from '../components/ui/BookSearchbox'
import { useBooks } from '../hooks/useBooks'
import { User, BookOpen, Target, Check, X, Loader2, ArrowLeft, ArrowRight, Camera, BookMarked } from 'lucide-react'
import api from '../utils/api'
import Avatar from '../components/ui/Avatar'
import clsx from 'clsx'

const validateUsername = (username) => {
  if (!username.trim()) return 'Username is required'
  if (username.length < 3) return 'Username must be at least 3 characters'
  if (username.length > 30) return 'Username must be under 30 characters'
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers and underscores'
  return null
}

const SettingsPage = ({ isOnboarding = false }) => {
  const { user, updateUser, login } = useAuthContext()
  const navigate = useNavigate()
  const { getProfile, updateProfile, getPreferences, savePreferences, updatePreferences, setReadingGoal, checkUsername } = useUser()
  const { showToast } = useToast()
  const {addToShelf,updateProgress}=useBooks()

  const [activeStep, setActiveStep] = useState(0)
  const [selectedBook, setSelectedBook] = useState(null)
  const [currentPageInput, setCurrentPageInput] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [name, setName] = useState(user.name ?? '')
  const [username, setUsername] = useState('')
  const [genres, setGenres] = useState([])
  const [bio, setBio] = useState('')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [goal, setGoal] = useState('')
  
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false)
  
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const { status: usernameStatus, message: usernameMessage } = useUsernameAvailability(username, user.username, checkUsername)

  const isProfileValid = Boolean(name.trim() && username.trim() && !validateUsername(username) && usernameStatus === 'available')
  const isGenresValid = selectedGenres.length > 0

  useEffect(() => {
    const fetchData = async () => {
      const [profileResult, prefsResult, genresResult] = await Promise.all([
        getProfile(),
        getPreferences(),
        api.get('/genres')
      ])

      if (profileResult.success) {
        const u = profileResult.data.user ?? profileResult.data
        setName(u.name ?? '')
        setUsername(u.username ?? '')
        setBio(u.bio ?? '')
        setGoal(u.yearly_goal ?? '')
      }

      if (prefsResult.success) {
        const genresList = prefsResult.data.preferences ?? prefsResult.data ?? []
        setSelectedGenres(genresList.map((g) => g.id ?? g))
      }
      setGenres(genresResult.data.genres ?? genresResult.data ?? [])
      setPageLoading(false)
    }

    fetchData()
  }, [])

  const toggleGenre = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId]
    )
  }

  const handleBookSelect = (book) => {
    setSelectedBook(book)
    setCurrentPageInput('')
  }

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }


  const handleSaveProfile = async () => {
    const usernameError = validateUsername(username)
    if (usernameError) { showToast(usernameError, 'error'); return }
    setSavingProfile(true)
    const result = await updateProfile({ name, username, bio })
    setSavingProfile(false)
    if (result.success) showToast('Profile updated', 'success')
    else showToast(result.error, 'error')
  }

  const handleSavePreferences = async () => {
    setSavingPrefs(true)
    const result = await updatePreferences(selectedGenres)
    setSavingPrefs(false)
    if (result.success) showToast('Preferences saved', 'success')
    else showToast(result.error, 'error')
  }

  const handleSaveGoal = async () => {
    const goalNum = parseInt(goal)
    if (isNaN(goalNum) || goalNum < 1) {
      showToast('Enter a valid goal (minimum 1)', 'error')
      return
    }
    setSavingGoal(true)
    const result = await setReadingGoal(goalNum)
    setSavingGoal(false)
    if (result.success) showToast('Reading goal set!', 'success')
    else showToast(result.error, 'error')
  }


  const handleOnboardingComplete = async (e) => {
    e.preventDefault()
    if (!isGenresValid) {
      showToast('Please select at least one genre', 'error')
      return
    }

    setIsSubmittingOnboarding(true)

    let profilePayload
    if (avatarFile) {
      profilePayload = new FormData()
      profilePayload.append('name', name)
      profilePayload.append('username', username)
      profilePayload.append('bio', bio)
      profilePayload.append('image', avatarFile)
    } else {
      profilePayload = { name, username, bio }
    }

    await updateProfile(profilePayload)

    if (selectedBook) {
    const shelfResult = await addToShelf({
      bookId: selectedBook.id ?? null,
      googleBooksId: selectedBook.googleBooksId,
      title: selectedBook.title,
      author: selectedBook.author,
      cover: selectedBook.cover_url,
      description: selectedBook.description,
      previewLink: selectedBook.preview_link,
      globalRating: selectedBook.average_rating,
      globalRatingsCount: selectedBook.ratings_count,
      pageCount: selectedBook.page_count ?? selectedBook.pageCount ?? null,
      status: 'reading',
    })

    if (shelfResult.success && currentPageInput) {
      const pageNum = parseInt(currentPageInput)
      if (!isNaN(pageNum) && pageNum >= 0) {
        const safePage = selectedBook.page_count
          ? Math.min(pageNum, selectedBook.page_count)
          : pageNum
        await updateProgress(shelfResult.data.bookId, safePage)
      }
    }
  }
    if (goal && parseInt(goal) > 0) {
      await setReadingGoal(parseInt(goal))
    }

    const result = await savePreferences(selectedGenres)
    setIsSubmittingOnboarding(false)

    if (result.success) {
      const newToken = result.data?.token
      if (newToken) {
        login(newToken)
      } else {
        updateUser({ onboarding_complete: true })
        showToast('Welcome to BookFolio!', 'success')
        navigate('/home')
      }
    } else {
      showToast(result.error, 'error')
    }
  }

  if (pageLoading) return <Spinner fullPage size='lg' />

  return (
    <PageWrapper className={clsx('settings-page', isOnboarding && 'settings-page--onboarding')}>
      
      <header className="settings-page__header">
        <h1 className="settings-page__title">
          {isOnboarding ? 'Let’s set up your profile' : 'Settings'}
        </h1>
        {isOnboarding && (
          <p className="settings-page__sub">
            Customize your library space in just a few quick clicks.
          </p>
        )}
      </header>

      {isOnboarding && (
        <div className="wizard-progress">
          <button onClick={() => setActiveStep(0)} className={clsx('wizard-step', activeStep === 0 && 'is-active', activeStep > 0 && 'is-done')}>
            <span className="wizard-step__icon">{activeStep > 0 ? <Check size={12} /> : '1'}</span>
            <span className="wizard-step__label">Profile</span>
          </button>
          <div className={clsx('wizard-line', activeStep > 0 && 'is-active')} />
          
          <button onClick={() => isProfileValid && setActiveStep(1)} disabled={!isProfileValid} className={clsx('wizard-step', activeStep === 1 && 'is-active', activeStep > 1 && 'is-done')}>
            <span className="wizard-step__icon">{activeStep > 1 ? <Check size={12} /> : '2'}</span>
            <span className="wizard-step__label">Preferences</span>
          </button>
          <div className={clsx('wizard-line', activeStep > 1 && 'is-active')} />
          
          <button onClick={() => isProfileValid && isGenresValid && setActiveStep(2)} disabled={!isProfileValid || !isGenresValid} className={clsx('wizard-step', activeStep === 2 && 'is-active')}>
            <span className="wizard-step__icon">3</span>
            <span className="wizard-step__label">Reading Goal</span>
          </button>
        </div>
      )}

      <form onSubmit={isOnboarding ? handleOnboardingComplete : (e) => e.preventDefault()} className="wizard-form-card">

        {( !isOnboarding || activeStep === 0 ) && (
          <section className="settings-page__section animated-fade-in">
            <div className="settings-page__section-header">
              <User size={16} />
              <h2 className="settings-page__personal-section-title">Personal Profile</h2>
            </div>

            <div className="settings-page__fields">
              <div className="settings-page__avatar-field">
                <div className="profile-page__avatar-wrap">
                  <Avatar name={name} src={avatarPreview} size="xl" />
                  <label htmlFor="onboarding-avatar-upload" className="profile-page__avatar-overlay">
                    <Camera size={14} />
                  </label>
                </div>
                <input
                  id="onboarding-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleAvatarFileChange}
                  style={{ display: 'none' }}
                />
                <p className="settings-page__section-sub">Click to upload a profile image</p>
              </div>

              <Input
                label="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                fullWidth
                className='settings-page__field'
              />

              <div className="username-field">
                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@yourhandle"
                  fullWidth
                  rightIcon={
                    usernameStatus === 'checking' ? <Loader2 size={16} className="spin" /> :
                    usernameStatus === 'available' ? <Check size={16} className="username-status__icon--ok" /> :
                    usernameStatus === 'taken' ? <X size={16} className="username-status__icon--bad" /> : null
                  }
                />
                {usernameMessage && (
                  <p className={clsx('username-status__message', usernameStatus === 'taken' && 'is-error')}>
                    {usernameMessage}
                  </p>
                )}
              </div>

              <div className="settings-page__field">
                <label className="settings-page__label">Bio</label>
                <textarea
                  className="settings-page__textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A brief description about yourself..."
                  rows={4}
                />
              </div>
            </div>

            {!isOnboarding && (
              <button
                type="button"
                className="settings-page__save-btn"
                onClick={handleSaveProfile}
                disabled={savingProfile || usernameStatus === 'checking' || usernameStatus === 'taken'}
              >
                {savingProfile ? 'Saving…' : 'Save Profile'}
              </button>
            )}
          </section>
        )}


        {( !isOnboarding || activeStep === 1 ) && (
          <section className="settings-page__section animated-fade-in">
            <div className="settings-page__section-header">
              <BookOpen size={16} />
              <h2 className="settings-page__section-title">Reading Preferences</h2>
            </div>
            <p className="settings-page__section-sub">
              Select genres you enjoy — these selections instantly tailor your book recommendation feeds.
            </p>

            <div className="settings-page__genres-grid">
              {genres.map((genre) => (
                <button
                  type="button"
                  key={genre.id}
                  className={clsx('settings-page__genre-pill', selectedGenres.includes(genre.id) && 'settings-page__genre-pill--active')}
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.name}
                </button>
              ))}
            </div>

            {!isOnboarding && (
              <button
                type="button"
                className="settings-page__save-btn"
                onClick={handleSavePreferences}
                disabled={savingPrefs}
              >
                {savingPrefs ? 'Saving…' : 'Save Preferences'}
              </button>
            )}
          </section>
        )}


        {( !isOnboarding || activeStep === 2 ) && (
          <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {isOnboarding && (
              <section className="settings-page__section" style={{ borderBottom: '1px solid var(--outline-variant)', paddingBottom: '32px' }}>
                <div className="settings-page__section-header">
                  <BookMarked size={16} />
                  <h2 className="settings-page__section-title">
                    Currently Reading <span className="settings-page__optional">(Optional)</span>
                  </h2>
                </div>
                <p className="settings-page__section-sub">
                  Add a book you're reading now to jumpstart your shelf.
                </p>

                <div className="settings-page__fields">
                  <BookSearchCombobox
                    placeholder="Search for a book..."
                    onSelect={handleBookSelect}
                  />

                  {selectedBook && (
                    <div className="create-club-page__book-preview">
                      {selectedBook.cover_url ? (
                        <img src={selectedBook.cover_url} alt={selectedBook.title} className="create-club-page__book-cover" />
                      ) : (
                        <div className="create-club-page__book-cover-fallback"><BookMarked size={20} /></div>
                      )}
                      <div className="create-club-page__book-info">
                        <p className="create-club-page__book-title">{selectedBook.title}</p>
                        <p className="create-club-page__book-author">{selectedBook.author}</p>
                      </div>
                      <button
                        type="button"
                        className="create-club-page__book-remove"
                        onClick={() => { setSelectedBook(null); setCurrentPageInput('') }}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {selectedBook && (
                    <Input
                      type="number"
                      label={`Current Page${selectedBook.page_count ? ` (of ${selectedBook.page_count})` : ''}`}
                      value={currentPageInput}
                      onChange={(e) => setCurrentPageInput(e.target.value)}
                      placeholder="e.g. 42"
                      min={0}
                      max={selectedBook.page_count || undefined}
                      fullWidth
                    />
                  )}
                </div>
              </section>
            )}

            
            <section className="settings-page__section">
              <div className="settings-page__section-header">
                <Target size={16} />
                <h2 className="settings-page__section-title">
                  Yearly Reading Goal <span className="settings-page__optional"></span>
                </h2>
              </div>
              <p className="settings-page__section-sub">
                How many books do you want to challenge yourself to read this calendar year?
              </p>

              <div className="settings-page__goal-row">
                <Input
                  type="number"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. 24"
                  
                />
                {!isOnboarding && (
                  <button
                    type="button"
                    className="settings-page__save-btn"
                    onClick={handleSaveGoal}
                    disabled={savingGoal}
                  >
                    {savingGoal ? 'Saving…' : 'Set Goal'}
                  </button>
                )}
              </div>
            </section>

          </div>
        )}


        {isOnboarding && (
          <footer className="wizard-footer">
            {activeStep > 0 ? (
              <button type="button" onClick={() => setActiveStep((prev) => prev - 1)} className="btn-wizard-secondary">
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}

            {activeStep < 2 ? (
              <button
                type="button"
                key='wizard-next'
                onClick={() => setActiveStep((prev) => prev + 1)}
                disabled={(activeStep === 0 && !isProfileValid) || (activeStep === 1 && !isGenresValid)}
                className="btn-wizard-primary"
              >
                Next<ArrowRight size={16} />
              </button>
            ) : (
              <button
                key='wizard submit'
                type="submit"
                disabled={isSubmittingOnboarding || !isGenresValid}
                className="btn-wizard-submit"
              >
                {isSubmittingOnboarding ? 'Setting up account...' : 'Enter the Library →'}
              </button>
            )}
          </footer>
        )}
      </form>
    </PageWrapper>
  )
}

export default SettingsPage