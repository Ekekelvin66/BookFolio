import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useAuthContext } from '../context/AuthContext'
import { useUsernameAvailability } from '../hooks/useUsernameAvailability'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import PageWrapper from '../components/layout/PageWrapper'
import Input from '../components/ui/Input'
import { User, BookOpen, Target,Check,X,Loader2 } from 'lucide-react'
import api from '../utils/api'
import clsx from 'clsx'


const validateUsername = (username) => {
  if (!username.trim()) return 'Username is required'
  if (username.length < 3) return 'Username must be at least 3 characters'
  if (username.length > 30) return 'Username must be under 30 characters'
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers and underscores'
  return null
}

const SettingsPage = ({isOnboarding=false}) => {
  const { user,updateUser,login } = useAuthContext()
  const navigate =useNavigate()
  const { getProfile, updateProfile, getPreferences, savePreferences,updatePreferences, setReadingGoal,checkUsername } = useUser()
  const { showToast } = useToast()


  const [pageLoading,setPageLoading] =useState(true)
  const [name, setName] = useState(user.name??'')
  const [username,setUsername]=useState('')
  const [genres,setGenres]=useState([])
  const [bio, setBio] = useState('')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [goal, setGoal] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const { status: usernameStatus, message: usernameMessage } = useUsernameAvailability(username, user.username, checkUsername)

  useEffect(() => {
    const fetchData = async () => {
      const [profileResult, prefsResult,genresResult] = await Promise.all([
        getProfile(),
        getPreferences(),
        api.get('/genres')
      ])

      if (profileResult.success) {
        const u = profileResult.data.user ?? profileResult.data
        setName(u.name ?? '')
        setUsername(u.username??'')
        setBio(u.bio ?? '')
        setGoal(u.yearly_goal ?? '')
      }

      if (prefsResult.success) {
        const genres = prefsResult.data.preferences ?? prefsResult.data ?? []
        setSelectedGenres(genres.map((g) => g.id ?? g))
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

  const handleSaveProfile = async () => {
    const usernameError = validateUsername(username)
    if (usernameError) { showToast(usernameError, 'error'); return }
    setSavingProfile(true)
    const result = await updateProfile({ name, username, bio })
    setSavingProfile(false)
    if (result.success) {
        showToast('Profile updated', 'success')
    } else {
        showToast(result.error, 'error')
    }
}

  const handleSavePreferences = async () => {
    setSavingPrefs(true)
    const result = await updatePreferences(selectedGenres)
    setSavingPrefs(false)
    if (result.success) {
      showToast('Preferences saved', 'success')
    } else {
      showToast(result.error, 'error')
    }
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
    if (result.success) {
      showToast('Reading goal set!', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleOnboardingComplete=async () => {
    const usernameError = validateUsername(username)
    if (usernameError) { showToast(usernameError, 'error'); return }

    if (selectedGenres.length === 0) {
        showToast('Please select at least one genre', 'error')
        return
    }

    await updateProfile({ name, username, bio })
    if (goal && parseInt(goal) > 0) {
      await setReadingGoal(parseInt(goal))
    }
   

    const result = await savePreferences(selectedGenres)
    if (result.success) {
      const newToken=result.data?.token
      if(newToken){
        login(newToken)
      }else{
        updateUser({onboarding_complete:true})
        showToast('Welcome to BookFolio!', 'success')
        navigate('/home')
      }
        
    } else {
        showToast(result.error, 'error')
    }
  }
  if (pageLoading) return <Spinner fullPage size='lg'/>

  return (
    <PageWrapper className="settings-page">
      <h1 className="settings-page__title">{isOnboarding ? 'Welcome! Fill out these fields to set up your profile' : 'Settings'}</h1>
        {isOnboarding && (
            <p className="settings-page__sub">
             Tell us a little about yourself to personalise your experience.
            </p>
        )}
      <section className="settings-page__section">
        <div className="settings-page__section-header">
          <User size={16} />
          <h2 className="settings-page__section-title">Profile</h2>
        </div>

        <div className="settings-page__fields">
          <Input
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            fullWidth
          />
          <div className="username-field">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@yourhandle"
              fullWidth
            />
            {usernameStatus === 'checking' && <Loader2 size={16} className="username-status__icon spin" />}
            {usernameStatus === 'available' && <Check size={16} className="username-status__icon username-status__icon--ok" />}
            {usernameStatus === 'taken' && <X size={16} className="username-status__icon username-status__icon--bad" />}
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
            className="settings-page__save-btn"
            onClick={handleSaveProfile}
            disabled={savingProfile || usernameStatus === 'checking' || usernameStatus === 'taken'}
          >
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
        )}
      </section>

      <section className="settings-page__section">
        <div className="settings-page__section-header">
          <BookOpen size={16} />
          <h2 className="settings-page__section-title">Reading Preferences</h2>
        </div>
        <p className="settings-page__section-sub">
          Select genres you enjoy — What you selct will be used to personalise your recommendations.
        </p>

        <div className="settings-page__genres">
          {genres.map((genre) => (
            <button
              key={genre.id}
              className={`settings-page__genre-pill ${selectedGenres.includes(genre.id) ? 'settings-page__genre-pill--active' : ''}`}
              onClick={() => toggleGenre(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>
        {!isOnboarding && (
          <button
            className="settings-page__save-btn"
            onClick={handleSavePreferences}
            disabled={savingPrefs}
          >
            {savingPrefs ? 'Saving…' : 'Save Preferences'}
          </button>
        )}
        
      </section>

      <section className="settings-page__section">
        <div className="settings-page__section-header">
          <Target size={16} />
          <h2 className="settings-page__section-title">Yearly Reading Goal</h2>
        </div>
        <p className="settings-page__section-sub">
          How many books do you want to read this year?
        </p>

        <div className="settings-page__goal-row">
          <Input
            type="number"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. 24"
            min={1}
            max={365}
          />
           {!isOnboarding && (
            <button
              className="settings-page__save-btn"
              onClick={handleSaveGoal}
              disabled={savingGoal}
            >
              {savingGoal ? 'Saving…' : 'Set Goal'}
            </button>
          )}
        </div>
      </section>
      {isOnboarding && (
       <button
          className="settings-page__onboarding-submit"
          onClick={handleOnboardingComplete}
          disabled={pageLoading || usernameStatus === 'checking' || usernameStatus === 'taken'}
        >
          {pageLoading ? 'Setting up…' : 'Enter the Library →'}
        </button>
      )}
    </PageWrapper>
  )
}

export default SettingsPage
