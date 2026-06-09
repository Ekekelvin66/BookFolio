import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useMessages } from '../hooks/useMessages'
import { useAuthContext } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import PageWrapper from '../components/layout/PageWrapper'
import Avatar from '../components/ui/Avatar'
import StarRating from '../components/ui/StarRating'
import Input from '../components/ui/Input'
import AvatarColorPicker from '../components/ui/AvatarColor'
import { Camera,Edit2, Check, X, MessageSquare, BookOpen, Heart, FileText } from 'lucide-react'

const ProfilePage = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser,updateUser } = useAuthContext()
  const { getProfile, getPublicProfile, updateProfile, removeAvatar, loading } = useUser()
  const { startConversation } = useMessages()
  const { showToast } = useToast()

  const isOwn = !userId || userId === String(currentUser?.id)

  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editUsername,setEditUsername]=useState('')
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (isOwn) {
        const result = await getProfile()
        if (result.success) {
          setProfile(result.data.user ?? result.data)
          setReviews(result.data.reviews ?? [])
          setStats(result.data.stats ?? null)
        } else {
          showToast(result.error, 'error')
        }
      } else {
        const result = await getPublicProfile(userId)
        if (result.success) {
          setProfile(result.data.user)
          setReviews(result.data.reviews ?? [])
          setStats(result.data.stats ?? null)
        } else {
          showToast(result.error, 'error')
        }
      }
    }
    fetchData()
  }, [userId])

  const handleEditStart = () => {
    setEditName(profile?.name ?? '')
    setEditBio(profile?.bio ?? '')
    setEditUsername(profile?.username??'')
    setEditing(true)
  }

  const handleEditSave = async () => {
    const result = await updateProfile({ name: editName, bio: editBio,username:editUsername})
    if (result.success) {
      setProfile((prev) => ({ ...prev, name: editName, bio: editBio,username:editUsername}))
      setEditing(false)
      showToast('Profile updated', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleMessage = async () => {
    const result = await startConversation(userId)
    if (result.success) {
      navigate(`/messages/${result.data.conversationId}`)
    } else {
      showToast(result.error, 'error')
    }
  }
  const handleColorChange = async (color) => {
    const result = await updateProfile({ avatar_color: color })
    if (result.success) {
        setProfile((prev) => ({ ...prev, avatar_color: color }))
        showToast('Avatar updated', 'success')
    } else {
        showToast(result.error, 'error')
    }
 }

  const handleAvatarFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  setAvatarFile(file)
  setAvatarPreview(URL.createObjectURL(file))
}

const handleAvatarUpload = async () => {
  if (!avatarFile) return
  setUploadingAvatar(true)

  const formData = new FormData()
  formData.append('image', avatarFile)

  const result = await updateProfile(formData)
  setUploadingAvatar(false)

  if (result.success) {
    if (result.data.token) {
      localStorage.setItem('token', result.data.token)
    }
    updateUser(result.data.user)
    setProfile((prev) => ({ ...prev, image_url: result.data.user.image_url }))
    setAvatarFile(null)
    setAvatarPreview(null)
    showToast('Avatar updated', 'success')
  } else {
    showToast(result.error, 'error')
  }
}


const handleRemoveAvatar = async () => {
  const result = await removeAvatar()
  if (result.success) {
    setProfile((prev) => ({ ...prev, image_url: null }))
    showToast('Photo removed', 'success')
  } else {
    showToast(result.error, 'error')
  }
}

  if (loading || !profile) return <Spinner />

  return (
    <PageWrapper className="profile-page">
      <div className="profile-page__header">
        {!isOwn ? (
          <Avatar
            name={profile.name}
            src={profile.image_url}
            color={profile.avatar_color}
            size="xl"
            className="profile-page__avatar"
          />
        ) : (
          <div className="profile-page__avatar-section">
            <div className="profile-page__avatar-wrap">
              <Avatar
                name={profile.name}
                src={avatarPreview ?? profile.image_url}
                color={profile.avatar_color}
                size="xl"
              />

              <label htmlFor="avatar-upload" className="profile-page__avatar-overlay">
                <Camera size={14} />
              </label>
            </div>

            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleAvatarFileChange}
              style={{ display: 'none' }}
            />

            {avatarFile && (
              <div className="profile-page__avatar-confirm">
                <Button variant="primary" size="sm" onClick={handleAvatarUpload} isLoading={uploadingAvatar}>
                  Save Photo
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}>
                  Cancel
                </Button>
              </div>
            )}

            {!avatarFile && profile.image_url && (
              <Button variant="danger" size="sm" onClick={handleRemoveAvatar}>
                Remove Photo
              </Button>
            )}
          </div>
        )}  

        <div className="profile-page__info">
          {editing ? (
            <div className="profile-page__edit-fields">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                fullWidth
              />

              <textarea
                className="profile-page__bio-input"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="A brief bio..."
                rows={3}
              />
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Username"
                fullWidth
              />
              <div className="profile-page__edit-actions">
                <button className="profile-page__edit-btn profile-page__edit-btn--save" onClick={handleEditSave}>
                  <Check size={14} /> Save
                </button>
                <button className="profile-page__edit-btn profile-page__edit-btn--cancel" onClick={() => setEditing(false)}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-page__name-row">
                <h1 className="profile-page__name">{profile.name}</h1>
                {isOwn && (
                  <button className="profile-page__edit-trigger" onClick={handleEditStart}>
                    <Edit2 size={15} />
                  </button> 
                )}
              </div>
              {profile.username && (
                <p className="profile-page__username">@{profile.username}</p>
              )}
              <span className="profile-page__role">Modern Scholar</span>
              {profile.bio && (
                <p className="profile-page__bio">{profile.bio}</p>
              )}
            </>
          )}

          {!isOwn && (
            <div className="profile-page__actions">
              <button className="profile-page__btn profile-page__btn--primary" onClick={handleMessage}>
                <MessageSquare size={14} /> Message
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-page__stats">
        <div className="profile-page__stat">
          <span className="profile-page__stat-value">{stats?.booksFinished ?? 0}</span>
          <span className="profile-page__stat-label">Books Finished</span>
        </div>
        <div className="profile-page__stat">
          <span className="profile-page__stat-value">{stats?.totalPagesRead ?? 0}</span>
          <span className="profile-page__stat-label">Pages Read</span>
        </div>
        <div className="profile-page__stat">
          <span className="profile-page__stat-value">{reviews.length}</span>
          <span className="profile-page__stat-label">Reviews</span>
        </div>
        <div className="profile-page__stat">
          <span className="profile-page__stat-value">{stats?.totalLikes ?? 0}</span>
          <span className="profile-page__stat-label">Likes Received</span>
        </div>
      </div>

      <div className="profile-page__body">
        <section className="profile-page__section">
          <h2 className="profile-page__section-title">
            {isOwn ? 'My Reviews' : `${profile.name}'s Reviews`}
          </h2>

          {reviews.length === 0 ? (
            <p className="profile-page__empty">No reviews yet.</p>
          ) : (
            <div className="profile-page__reviews">
              {reviews.map((review) => (
                <Link
                  key={review.id}
                  to={`/books/${review.book_id}`}
                  className="profile-page__review-card"
                >
                  {review.cover_url && (
                    <img
                      src={review.cover_url}
                      alt={review.title}
                      className="profile-page__review-cover"
                    />
                  )}
                  <div className="profile-page__review-body">
                    <p className="profile-page__review-title">{review.title}</p>
                    <p className="profile-page__review-author">{review.author}</p>
                    <StarRating value={Number(review.rating)} readOnly size="sm" />
                    {review.review_text && (
                      <p className="profile-page__review-excerpt">
                        {review.review_text.length > 150
                          ? `${review.review_text.slice(0, 150)}…`
                          : review.review_text}
                      </p>
                    )}
                    <div className="profile-page__review-meta">
                      <span className="profile-page__review-likes">
                        <Heart size={12} /> {review.helpful_count ?? 0}
                      </span>
                      <span className="profile-page__review-comments">
                        <FileText size={12} /> {review.comment_count ?? 0}
                      </span>
                      <span className="profile-page__review-date">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  )
}

export default ProfilePage
