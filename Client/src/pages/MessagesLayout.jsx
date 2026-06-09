import { useEffect, useState, useCallback,useRef } from 'react'
import { useParams, useNavigate,} from 'react-router-dom'
import { useMessages } from '../hooks/useMessages'
import { useBookClubs } from '../hooks/useClubs'
import { useAuthContext } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import getSocket from '../socket'
import PageWrapper from '../components/layout/PageWrapper'
import ConversationList from '../components/messages/ConversationList'
import EmptyCenter from '../components/messages/EmptyCenter'
import ChatPanel from '../components/messages/ChatPanel'
import clsx from 'clsx'


const MessagesLayout = () => {
  const { conversationId, clubId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { getConversations, muteConversation, unmuteConversation,deleteConversation } = useMessages()
  const { getMyClubs, muteClub, unmuteClub,deleteClub } = useBookClubs()
  const { showToast } = useToast()
  const socketListenerRef = useRef(null);

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  const activeType = clubId ? 'club' : conversationId ? 'private' : null
  const activeId   = clubId ? Number(clubId) : conversationId ? Number(conversationId) : null

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [dmResult, clubResult] = await Promise.all([
          getConversations(),
          getMyClubs(),
        ])

        const dms = dmResult.success ? (dmResult.data.conversations ?? []) : []
        const clubs = clubResult.success
          ? (clubResult.data.clubs ?? []).map((club) => ({
              id:           club.id,
              type:         'club',
              club_name:    club.name,
              member_count: Number(club.member_count),
              unread_count: Number(club.unread_count ?? 0),
              is_muted:     false,
              last_message: {
                body:        club.last_message_text ?? null,
                created_at:  club.last_message_at   ?? null,
                sender_name: club.last_sender_name  ?? null,
              },
              current_book: club.current_book_title ?? null,
            }))
          : []

        if (!dmResult.success)   showToast(dmResult.error,   'error')
        if (!clubResult.success) showToast(clubResult.error, 'error')

        const loaded = [...dms, ...clubs]
        if (activeId && activeType) {
          setConversations(
            loaded.map((c) =>
              c.id === activeId && c.type === activeType
                ? { ...c, unread_count: 0 }
                : c
            )
          )
        } else {
          setConversations(loaded)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  useEffect(() => {
    if (!activeId || !activeType) return
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId && c.type === activeType
          ? { ...c, unread_count: 0 }
          : c
      )
    )
  }, [activeId, activeType])

  useEffect(() => {
    const socket = getSocket();
    
    const messageListenerRef = { current: null };
    const clubMessageListenerRef = { current: null };

    const handleReceiveMessage = (msg) => {
      if (!msg.conversationId) return;
      setConversations((prev) => {
        const isLookingAtThisChat = activeType === 'private' && activeId === msg.conversationId;
        const existingIndex = prev.findIndex((c) => c.type === 'private' && c.id === msg.conversationId);
        
        let updatedList = [...prev];

        if (existingIndex > -1) {
          const target = { ...updatedList[existingIndex] };
          target.last_message = {
            body: msg.message_text,
            created_at: msg.created_at,
            sender_name: msg.sender?.name,
          };
          if (!isLookingAtThisChat) {
            target.unread_count = (target.unread_count ?? 0) + 1;
          }
          updatedList.splice(existingIndex, 1);
          updatedList.unshift(target);
        } else {
          updatedList.unshift({
            id: msg.conversationId,
            type: 'private',
            unread_count: isLookingAtThisChat ? 0 : 1,
            user: msg.sender, 
            last_message: { body: msg.message_text, created_at: msg.created_at },
            is_muted: false
          });
        }
        return updatedList;
      });
    };

    const handleReceiveClubMessage = (msg) => {
      if (!msg.clubId) return;
      setConversations((prev) => {
        const isLookingAtThisClub = activeType === 'club' && activeId === msg.clubId;
        const existingIndex = prev.findIndex((c) => c.type === 'club' && c.id === msg.clubId);
        
        let updatedList = [...prev];
        if (existingIndex > -1) {
          const target = { ...updatedList[existingIndex] };
          target.last_message = {
            body: msg.message_text,
            created_at: msg.created_at,
            sender_name: msg.sender?.name,
          };
          if (!isLookingAtThisClub) {
            target.unread_count = (target.unread_count ?? 0) + 1;
          }
          updatedList.splice(existingIndex, 1);
          updatedList.unshift(target);
        }
        return updatedList;
      });
    };

    
    socket.on('receive_message', handleReceiveMessage);
    socket.on('receive_club_message', handleReceiveClubMessage);
    
    messageListenerRef.current = handleReceiveMessage;
    clubMessageListenerRef.current = handleReceiveClubMessage;

    return () => {
      if (messageListenerRef.current) socket.off('receive_message', messageListenerRef.current);
      if (clubMessageListenerRef.current) socket.off('receive_club_message', clubMessageListenerRef.current);
    };
  }, [activeId, activeType]); 
  

  const handleSelect = (id, type) => {
    if (type === 'club') {
      navigate(`/messages/club/${id}`)
    } else {
      navigate(`/messages/${id}`)
    }
  }

  const handleBack = () => {
    navigate('/messages')
  }

  const handleMute = async (id, type) => {
    const target = conversations.find((c) => c.id === id && c.type === type)
    if (!target) return

    const currentlyMuted = target.is_muted
    let muteResult

    try {
      if (type === 'private') {
        muteResult = currentlyMuted
          ? await unmuteConversation(id)
          : await muteConversation(id)
      } else {
        muteResult = currentlyMuted
          ? await unmuteClub(id)
          : await muteClub(id)
      }

      if (muteResult && muteResult.success) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id && c.type === type
              ? { ...c, is_muted: !c.is_muted }
              : c
          )
        )
        showToast(
          currentlyMuted ? 'Conversation unmuted' : 'Conversation muted',
          'success'
        )
      } else {
        showToast(muteResult?.error || 'Failed to update mute status', 'error')
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error')
    }
  }

  const handleDelete= async(id,type)=>{
    if (type==='club')
      return
    
    const result= await deleteConversation(id)
    if(result.success){
      setConversations(prev=>prev.filter(c=>!(c.id===id && c.type===type)))
    }
    else{
      showToast(result.error,'error')
    }
  }

  const updateLastMessage = useCallback((id, type, message) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === Number(id) && c.type === type
          ? { ...c, last_message: message }
          : c
      )
    )
  }, [])

  if (loading) return <Spinner />

  const showList = !activeId
  const showChat = Boolean(activeId)

  return (
    <PageWrapper className="messages-layout">
      <div className="messages-layout__panels">
        <div className={clsx(
          'messages-layout__left',
          showChat && 'messages-layout__left--hidden-mobile'
        )}>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            activeType={activeType}
            onSelect={handleSelect}
            isLoading={loading}
            onMute={handleMute}
            onDelete={handleDelete}
          />
        </div>

        <div className={clsx(
          'messages-layout__center',
          showList && 'messages-layout__center--hidden-mobile'
        )}>
          {showChat ? (
            <ChatPanel
              onUpdateLastMessage={updateLastMessage}
              key={`${activeType}-${activeId}`}
              conversationId={activeType === 'private' ? String(activeId) : null}
              clubId={activeType === 'club' ? String(activeId) : null}
              type={activeType}
              user={user}
              onBack={handleBack}
            />
          ) : (
            <EmptyCenter />
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

export default MessagesLayout