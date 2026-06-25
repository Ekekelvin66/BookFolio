import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useBookClubs } from '../hooks/useClubs'
import { useAuthContext } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import PageWrapper from '../components/layout/PageWrapper'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { ArrowLeft, UserPlus, Edit2, Trash2, AlertTriangle, ArrowRightLeft } from 'lucide-react'
import clsx from 'clsx'

const TABS = ['General', 'Members', 'Privacy']

const ClubSettingsPage = () => {
  const { clubId } = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuthContext()
  const {
    getClub, editClub, deleteClub,
    removeMember, transferOwnership,
    getJoinRequests, approveRequest, rejectRequest,
    loading,
  } = useBookClubs()
  const { showToast } = useToast()

  const [activeTab, setActiveTab]     = useState('General')
  const [club, setClub]               = useState(null)
  const [members, setMembers]         = useState([])
  const [joinRequests, setJoinRequests] = useState([])

  const [name, setName]               = useState('')
  const [motto, setMotto]             = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre]             = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)

 
  const [isPrivate, setIsPrivate]     = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)

  const [disbandOpen, setDisbandOpen]     = useState(false)
  const [transferOpen, setTransferOpen]   = useState(false)
  const [transferTarget, setTransferTarget] = useState(null)
  const [removeTarget, setRemoveTarget]   = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const result = await getClub(clubId)
      if (result.success) {
        const c = result.data.club

        if (c.my_role !== 'owner') {
          showToast('Only owners can access club settings', 'error')
          navigate(`/clubs/${clubId}`,{replace:true})
          return
        }
        setClub(c)
        setMembers(result.data.members ?? [])
        setName(c.name ?? '')
        setMotto(c.motto ?? '')
        setDescription(c.description ?? '')
        setGenre(c.genre ?? '')
        setIsPrivate(c.is_private ?? false)
      } else {
        if (result.error?.includes('abort') || result.error === 'canceled') return
        showToast(result.error, 'error')
        navigate('/clubs')
      }
    }
    fetchData()
  }, [clubId,navigate,showToast])

  useEffect(() => {
    if (activeTab !== 'Members') return
    const fetchRequests = async () => {
      const result = await getJoinRequests(clubId)
      if (result.success){
        setJoinRequests(result.data.requests ?? [])
      } else{
        showToast('Unable to fetch Requests at this moment','error')
      }
    }
    fetchRequests()
  }, [activeTab,clubId])

  const handleSaveGeneral = async (e) => {
    e.preventDefault()
    if(!name.trim()){
      showToast('Club Name cannot be blank','error')
    }
    
    setSavingProfile(true)
     let payload

  if (coverFile) {
    payload = new FormData()
    payload.append('name', name.trim())
    payload.append('motto', motto.trim() || '')
    payload.append('description', description.trim() || '')
    payload.append('genre', genre.trim() || '')
    payload.append('image', coverFile)
  } else {
    payload = { name, motto, description, genre }
  }

  const result = await editClub(clubId, payload)
  setSavingProfile(false)

  if (result.success) {
    setClub((prev) => ({ 
      ...prev, 
      name, motto, description, genre,
      ...(result.data.club?.cover_url && { cover_url: result.data.club.cover_url })
    }))
    setCoverFile(null)
    setCoverPreview(null)
    showToast('Club profile updated', 'success')
  } else {
    showToast(result.error, 'error')
  }

    
  }

  const handleCoverChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  setCoverFile(file)
  setCoverPreview(URL.createObjectURL(file))
}

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true)
    const result = await editClub(clubId, { is_private: isPrivate })
    setSavingPrivacy(false)
    if (result.success) {
      showToast('Privacy settings updated', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleRemoveMember = async (memberId) => {
    const result = await removeMember(clubId, memberId)
    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      setRemoveTarget(null)
      showToast('Member removed', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleTransfer = async () => {
    if (!transferTarget) return
    const result = await transferOwnership(clubId, transferTarget.id)
    if (result.success) {
      showToast('Ownership transferred', 'success')
      navigate(`/clubs/${clubId}`)
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleDisband = async () => {
    const result = await deleteClub(clubId)
    if (result.success) {
      showToast('Club disbanded', 'success')
      navigate('/clubs')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleApprove = async (requestUserId) => {
    const result = await approveRequest(clubId, requestUserId)
    if (result.success) {
      setJoinRequests((prev) => prev.filter((r) => r.user_id !== requestUserId))
      showToast('Request approved', 'success')
      const freshClub = await getClub(clubId)
      if (freshClub.success) {
        setClub(freshClub.data.club)
        setMembers(freshClub.data.members ?? [])
      }
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleReject = async (requestUserId) => {
    const result = await rejectRequest(clubId, requestUserId)
    if (result.success) {
      setJoinRequests((prev) => prev.filter((r) => r.user_id !== requestUserId))
      showToast('Request rejected', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  if (loading || !club) return <Spinner fullPage size='md' />

  return (
    <PageWrapper className="club-settings-page">

      
      <div className="club-settings-page__header">
        <Link to={`/clubs/${clubId}`} className="club-settings-page__back">
          <ArrowLeft size={15} />
        </Link>
        <h1 className="club-settings-page__title">Club Settings</h1>
      </div>

     
      <div className="club-settings-page__tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={clsx(
              'club-settings-page__tab',
              activeTab === tab && 'club-settings-page__tab--active'
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      
      {activeTab === 'General' && (
        <div className="club-settings-page__body">
          <section className="club-settings-page__section">
            <h2 className="club-settings-page__section-title">Club Identity</h2>
            <p className="club-settings-page__section-sub">
              Define how your book club appears to the public and potential scholars.
            </p>

              <form
                className="club-settings-page__fields"
                onSubmit={handleSaveGeneral}
              >
                <div className="club-settings-page__field">
                  <label className="club-settings-page__label">
                    Club Name
                  </label>

                  <Input
                    className="club-settings-page__input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Club name"
                    name="name"
                  />
                </div>

                <div className="club-settings-page__field">
                  <label className="club-settings-page__label">
                    Motto
                  </label>

                  <Input
                    className="club-settings-page__input club-settings-page__input--italic"
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    placeholder="Your club's guiding phrase..."
                    name="motto"
                  />
                </div>

                <div className="club-settings-page__field">
                  <label className="club-settings-page__label">
                    Genre
                  </label>

                  <Input
                    className="club-settings-page__input"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Classic Literature, Philosophy"
                    name="genre"
                  />
                </div>

                <div className="club-settings-page__field">
                  <label className="club-settings-page__label">Club Cover Image</label>

                  {(coverPreview || club?.cover_url) && (
                    <div className="club-settings-page__cover-preview">
                      <img 
                        src={coverPreview ?? club.cover_url} 
                        alt="Club cover" 
                      />
                      {coverPreview && (
                        <button
                          type="button"
                          onClick={() => { setCoverFile(null); setCoverPreview(null) }}
                          className="club-settings-page__cover-remove"
                        >
                          Remove new image
                        </button>
                      )}
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverChange}
                    className="club-settings-page__file-input"
                  />
                </div>
                <div className="club-settings-page__field">
                  <label className="club-settings-page__label">
                    Description
                  </label>

                  <textarea
                    className="club-settings-page__textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Describe your club's focus and spirit..."
                    name="description"
                  />
                </div>

                <div className="club-settings-page__actions">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setName(club.name ?? '')
                      setMotto(club.motto ?? '')
                      setDescription(club.description ?? '')
                      setGenre(club.genre ?? '')
                      setCoverFile(null)    
                      setCoverPreview(null)
                    }}
                  >
                    Discard Changes
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={savingProfile}
                  >
                    Save Profile
                  </Button>
                </div>
              </form>

          </section>
        </div>
      )}

      
      {activeTab === 'Members' && (
        <div className="club-settings-page__body">

          {joinRequests.length > 0 && (
            <section className="club-settings-page__section">
              <h2 className="club-settings-page__section-title">
                Join Requests
                <span className="club-settings-page__badge">{joinRequests.length}</span>
              </h2>
              <div className="club-settings-page__member-list">
                {joinRequests.map((req) => (
                  <div key={req.id} className="club-settings-page__member-row">
                    <Avatar src= {req.image_url} name={req.name} color={req.avatar_color} size="sm" />
                    <div className="club-settings-page__member-info">
                      <p className="club-settings-page__member-name">{req.name}</p>
                      <p className="club-settings-page__member-meta">
                        Requested {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="club-settings-page__request-actions">
                      <Button variant="primary" size="sm" onClick={() => handleApprove(req.user_id)}>
                        Approve
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleReject(req.user_id)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="club-settings-page__section">
            <div className="club-settings-page__section-header">
              <div>
                <h2 className="club-settings-page__section-title">Member Management</h2>
                <p className="club-settings-page__section-sub">
                  Currently overseeing {club.member_count} active scholars.
                </p>
              </div>
              <Button variant="ghost" leftIcon={<UserPlus size={14} />}>
                Invite Scholar
              </Button>
            </div>

            <div className="club-settings-page__member-list">
              {members.filter((m) => m.id !== user?.id).map((member) => (
                <div key={member.id} className="club-settings-page__member-row">
                  <Avatar src={member.image_url}name={member.name} color={member.avatar_color} size="sm" />
                  <div className="club-settings-page__member-info">
                    <p className="club-settings-page__member-name">{member.name}</p>
                    <p className="club-settings-page__member-meta">
                      Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      {' '}• {member.role === 'owner' ? 'Owner' : 'Member'}
                    </p>
                  </div>
                  <div className="club-settings-page__member-actions">
                    <button
                      className="club-settings-page__icon-btn"
                      onClick={() => {
                        setTransferTarget(member)
                        setTransferOpen(true)
                      }}
                      title="Transfer ownership"
                    >
                      <ArrowRightLeft size={14} />
                    </button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setRemoveTarget(member)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {members.length > 3 && (
              <p className="club-settings-page__view-all">
                View All Members ({club.member_count})
              </p>
            )}
          </section>
        </div>
      )}

    
      {activeTab === 'Privacy' && (
        <div className="club-settings-page__body">

          <section className="club-settings-page__section">
            <h2 className="club-settings-page__section-title">Visibility</h2>
            <p className="club-settings-page__section-sub">
              Control who can find and join your club.
            </p>

            <div className="club-settings-page__radio-group">
              <label className={clsx('club-settings-page__radio-option', !isPrivate && 'club-settings-page__radio-option--active')}>
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                />
                <div>
                  <p className="club-settings-page__radio-label">Public</p>
                  <p className="club-settings-page__radio-sub">Anyone can find and join this club</p>
                </div>
              </label>

              <label className={clsx('club-settings-page__radio-option', isPrivate && 'club-settings-page__radio-option--active')}>
                <input
                  type="radio"
                  name="visibility"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                />
                <div>
                  <p className="club-settings-page__radio-label">Private</p>
                  <p className="club-settings-page__radio-sub">Members must request to join and be approved</p>
                </div>
              </label>
            </div>

            <Button variant="primary" isLoading={savingPrivacy} onClick={handleSavePrivacy}>
              Save Privacy Settings
            </Button>
          </section>

         
          <section className="club-settings-page__section">
            <h2 className="club-settings-page__section-title">Administrative Actions</h2>

            <div className="club-settings-page__admin-grid">
              <div className="club-settings-page__admin-card">
                <p className="club-settings-page__admin-eyebrow">OWNERSHIP</p>
                <h3 className="club-settings-page__admin-title">Transfer Ownership</h3>
                <p className="club-settings-page__admin-desc">
                  Pass the quill to another scholar. You will lose all administrative privileges but remain a member.
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setTransferOpen(true)}
                >
                  Initiate Transfer
                </Button>
              </div>

              <div className="club-settings-page__admin-card club-settings-page__admin-card--danger">
                <p className="club-settings-page__admin-eyebrow">
                  <AlertTriangle size={12} /> DANGER ZONE
                </p>
                <h3 className="club-settings-page__admin-title">Disband Club</h3>
                <p className="club-settings-page__admin-desc">
                  Dissolve the club archives and remove all members. This action is irreversible and final.
                </p>
                <Button
                  variant="danger"
                  onClick={() => setDisbandOpen(true)}
                >
                  Disband Forever
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      
      <Modal
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove Member"
        size="sm"
      >
        <p className="modal__body-text">
          Are you sure you want to remove <strong>{removeTarget?.name}</strong> from this club?
        </p>
        <div className="modal__actions">
          <Button variant="ghost" onClick={() => setRemoveTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleRemoveMember(removeTarget.id)}>
            Remove
          </Button>
        </div>
      </Modal>

     
      <Modal
        isOpen={transferOpen}
        onClose={() => { setTransferOpen(false); setTransferTarget(null) }}
        title="Transfer Ownership"
        size="sm"
      >
        <p className="modal__body-text">
          Select a member to transfer ownership to. You will become a regular member and lose ownership functions.
        </p>
        <div className="club-settings-page__transfer-list">
          {members.filter((m) => m.id !== user?.id && m.role !== 'owner').map((m) => (
            <button
              key={m.id}
              className={clsx(
                'club-settings-page__transfer-option',
                transferTarget?.id === m.id && 'club-settings-page__transfer-option--selected'
              )}
              onClick={() => setTransferTarget(m)}
            >
              <Avatar name={m.name} color={m.avatar_color} size="sm" />
              <span>{m.name}</span>
            </button>
          ))}
        </div>
        <div className="modal__actions">
          <Button variant="ghost" onClick={() => { setTransferOpen(false); setTransferTarget(null) }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!transferTarget}
            onClick={handleTransfer}
          >
            Confirm Transfer
          </Button>
        </div>
      </Modal>

    
      <Modal
        isOpen={disbandOpen}
        onClose={() => setDisbandOpen(false)}
        title="Disband Club"
        size="sm"
      >
        <p className="modal__body-text">
          Are you absolutely sure? This will permanently delete <strong>{club.name}</strong>,
          remove all members, and erase all club messages and history. This cannot be undone.
        </p>
        <div className="modal__actions">
          <Button variant="ghost" onClick={() => setDisbandOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDisband}>
            Disband Forever
          </Button>
        </div>
      </Modal>

    </PageWrapper>
  )
}

export default ClubSettingsPage
