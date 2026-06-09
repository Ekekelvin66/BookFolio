import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookClubs } from '../hooks/useClubs'
import { useToast } from '../context/ToastContext'
import PageWrapper from '../components/layout/PageWrapper'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import BookSearchCombobox from '../components/ui/BookSearchbox'
import { BookOpen, Shield, Globe } from 'lucide-react'

const CreateClubPage = () => {
  const navigate = useNavigate()
  const { createClub, loading } = useBookClubs()
  const { showToast } = useToast()


  
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [name, setName] = useState('')
  const [motto, setMotto] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = 'Club name is required'
    if (name.trim().length < 3) e.name = 'Name must be at least 3 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleBookSelect = (book) => {
    setSelectedBook(book)
  }
  const handleCoverChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  setCoverFile(file)
  setCoverPreview(URL.createObjectURL(file)) 
}

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return


  const formData = new FormData()
  formData.append('name', name.trim())
  formData.append('motto', motto.trim() || '')
  formData.append('description', description.trim() || '')
  formData.append('genre', genre.trim() || '')
  formData.append('is_private', isPrivate)
  formData.append('initialBookId', selectedBook?.googleBooksId ?? selectedBook?.id ?? '')
  formData.append('initialTitle', selectedBook?.title ?? '')
  formData.append('initialAuthor', selectedBook?.author ?? '')
  formData.append('initialCoverUrl', selectedBook?.cover_url ?? '')
  formData.append('initialPageCount', selectedBook?.page_count ?? '')

  if(coverFile){
    formData.append('image',coverFile)
  }

    const result = await createClub(formData)
    if (result.success) {
      showToast('Club Created', 'success')
      navigate(`/clubs/${result.data.club.id}`)
    } else {
      showToast(result.error, 'error')
    }
  }

  return (
    <PageWrapper className="create-club-page">
      <div className="create-club-page__container">

        <div className="create-club-page__header">
          <h1 className="create-club-page__title">Establish a New Literary Circle</h1>
          <p className="create-club-page__sub">
            Create a group for shared thought and intellectual discourse.
          </p>
        </div>

      <form onSubmit={handleSubmit} className="create-club-page__form">
      <div className="create-club-page__field">
        <label className="create-club-page__label">CLUB NAME</label>
        <Input
          type="text"
          className={`create-club-page__input ${errors.name ? 'create-club-page__input--error' : ''}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., The Inkwell Society"
        />
        {errors.name && <p className="create-club-page__error">{errors.name}</p>}
      </div>

      <div className="create-club-page__field">
        <label className="create-club-page__label">
          MOTTO <span className="create-club-page__optional">(optional)</span>
        </label>
        <Input
          type="text"
          className="create-club-page__input create-club-page__input--italic"
          value={motto}
          onChange={(e) => setMotto(e.target.value)}
          placeholder="Gathering in the shadows of great minds."
        />
      </div>

      <div className="create-club-page__field">
        <label className="create-club-page__label">DESCRIPTION</label>
        <textarea
          className="create-club-page__textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Define the intellectual focus and spirit of your circle..."
          rows={4}
        />
      </div>
      <div className="create-club-page__field">
        <label className="create-club-page__label">
          CLUB COVER <span className="create-club-page__optional">(optional)</span>
        </label>

        {coverPreview && (
          <div className="create-club-page__cover-preview">
            <img src={coverPreview} alt="Cover preview" />
            <button 
              type="button" 
              onClick={() => { setCoverFile(null); setCoverPreview(null) }}
            >
              Remove
            </button>
          </div>
          )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverChange}
              className="create-club-page__file-input"
            />
      </div>

      <div className="create-club-page__field">
        <label className="create-club-page__label">
          GENRE <span className="create-club-page__optional">(optional)</span>
        </label>
        <Input
          type="text"
          className="create-club-page__input"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="e.g., Philosophy, Classic Literature, History"
        />
      </div>

      <div className="create-club-page__row">
        <div className="create-club-page__field create-club-page__field--half">
          <label className="create-club-page__label">VISIBILITY</label>
          <div className="create-club-page__radio-group">
            <label className={`create-club-page__radio-option ${!isPrivate ? 'create-club-page__radio-option--active' : ''}`}>
              <Input
                type="radio"
                name="visibility"
                checked={!isPrivate}
                onChange={() => setIsPrivate(false)}
              />
              <Globe size={14} />
              Public
            </label>
            <label className={`create-club-page__radio-option ${isPrivate ? 'create-club-page__radio-option--active' : ''}`}>
              <Input
                type="radio"
                name="visibility"
                checked={isPrivate}
                onChange={() => setIsPrivate(true)}
              />
              <Shield size={14} />
              Private
            </label>
          </div>
          {isPrivate && (
            <p className="create-club-page__hint">
              Private circles require an invitation to join.
            </p>
          )}
        </div>

        <div className="create-club-page__field create-club-page__field--half">
          <label className="create-club-page__label">
            INITIAL BOOK <span className="create-club-page__optional">(optional)</span>
          </label>
          <BookSearchCombobox
            placeholder="Search our archives..."
            onSelect={handleBookSelect}
            className="create-club-page__book-search"
          />
        </div>
      </div>

      {selectedBook ? (
        <div className="create-club-page__book-preview">
          {selectedBook.cover_url ? (
            <img
              src={selectedBook.cover_url}
              alt={selectedBook.title}
              className="create-club-page__book-cover"
            />
          ) : (
            <div className="create-club-page__book-cover-fallback">
              <BookOpen size={20} />
            </div>
          )}
          <div className="create-club-page__book-info">
            <p className="create-club-page__book-title">{selectedBook.title}</p>
            <p className="create-club-page__book-author">by {selectedBook.author}</p>
          </div>
          <Button
            type="button"
            className="create-club-page__book-remove"
            onClick={() => setSelectedBook(null)}
          >
            ×
          </Button>
        </div>
      ) : (
        <div className="create-club-page__book-empty">
          <div className="create-club-page__book-empty-icon">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="create-club-page__book-empty-title">No book selected yet</p>
            <p className="create-club-page__book-empty-sub">
              Begin your first collective journey by selecting a title.
            </p>
          </div>
        </div>
      )}

      <div className="create-club-page__actions">
        <Button type="button" variant="ghost" onClick={() => navigate('/clubs')}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={loading}>
          Establish Circle
        </Button>
      </div>
    </form>
      </div>
    </PageWrapper>
  )
}

export default CreateClubPage
