import { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import getSocket from '../../socket'
import Spinner from '../ui/Spinner'
import Avatar from '../ui/Avatar'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import { useNotificationContext } from '../../context/NotificationContext'
import { useMessages } from '../../hooks/useMessages'
import { useBookClubs } from '../../hooks/useClubs'
import { useToast } from '../../context/ToastContext'
import Button from '../ui/Button'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

const PrivateChat = ({ conversationId, user, onBack, onUpdateLastMessage }) => {
  const { getMessages, loading } = useMessages()
  const { refresh } = useNotificationContext()
  const { showToast } = useToast()
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [replyTo, setReplyTo] = useState(null)

  const onUpdateLastMessageRef = useRef(onUpdateLastMessage)
  useEffect(() => { onUpdateLastMessageRef.current = onUpdateLastMessage }, [onUpdateLastMessage])

  const loadMessages = useCallback(async () => {
    const result = await getMessages(conversationId)
    if (result.success) {
      setMessages(result.data.messages ?? [])
      setOtherUser(result.data.otherUser ?? null)
      refresh()
    } else {
      showToast(result.error, 'error')
    }
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) return
    loadMessages()
    const socket = getSocket()
    const joinRoom = () => socket.emit('join_conversation', conversationId)
    if (socket.connected) joinRoom()
    else socket.once('connect', joinRoom)

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.optimistic && m.id === msg.tempId)
        if (idx !== -1) {
          const next = [...prev]
          next[idx] = { ...msg, optimistic: false }
          return next
        }
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      onUpdateLastMessage?.(conversationId, 'private', {
        body: msg.message_text, created_at: msg.created_at, sender_name: msg.sender?.name ?? null,
      })
    }
    socket.on('receive_message', handleReceiveMessage)
    return () => {
      socket.emit('leave_conversation', conversationId)
      socket.off('connect', joinRoom)
      socket.off('receive_message', handleReceiveMessage)
    }
  }, [conversationId])

  const handleSend = async (text) => {
    if (!text.trim()) return
    const socket = getSocket()
    const tempId = `optimistic-${Date.now()}`
    const optimistic = {
      id: tempId, message_text: text, created_at: new Date().toISOString(), is_read: false, is_sent: true,
      sender: { id: user.id, name: user.name }, optimistic: true, replyTo: replyTo,
    }
    setMessages((prev) => [...prev, optimistic])
    socket.emit('send_message', { conversationId: Number(conversationId), message: text, senderId: user.id, tempId, replyToMessageId: replyTo?.id })
    setReplyTo(null)
  }

  if (loading && messages.length === 0) return <div className="messages-layout__chat-loading"><Spinner /></div>

  return (
    <ChatShell
      header={otherUser ? (
        <Link to={`/profile/${otherUser.id}`} className="messages-layout__chat-user">
          <Avatar src={otherUser.other_user_image} name={otherUser.name} color={otherUser.avatar_color} size="sm" />
          <div className="messages-layout__chat-user-info">
            <p className="messages-layout__chat-user-name">{otherUser.name}</p>
            {otherUser.currently_reading && <p className="messages-layout__chat-user-sub">Reading: {otherUser.currently_reading}</p>}
          </div>
        </Link>
      ) : null}
      messages={messages}
      user={user}
      onBack={onBack}
      onSend={handleSend}
      showSenderName={false}
      replyTo={replyTo}
      onSetReply={setReplyTo}
    />
  )
}

const ClubChat = ({ clubId, user, onBack, onUpdateLastMessage }) => {
  const { getClubMessages, loading } = useBookClubs()
  const { showToast } = useToast()
  const [messages, setMessages] = useState([])
  const [club, setClub] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const onUpdateLastMessageRef = useRef(onUpdateLastMessage)
  useEffect(() => { onUpdateLastMessageRef.current = onUpdateLastMessage }, [onUpdateLastMessage])

  const loadMessages = useCallback(async () => {
    const result = await getClubMessages(clubId)
    if (result.success) {
      setMessages(result.data.messages ?? [])
      setClub(result.data.club ?? null)
    } else {
      showToast(result.error, 'error')
    }
  }, [clubId])

  useEffect(() => {
    if (!clubId) return
    loadMessages()
    const socket = getSocket()
    const joinClubRoom = () => socket.emit('join_club_room', clubId)
    if (socket.connected) joinClubRoom()
    else socket.once('connect', joinClubRoom)

    const handleReceiveClubMessage = (msg) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.optimistic && m.message_text === msg.message_text)
        if (idx !== -1) {
          const next = [...prev]
          next[idx] = { ...msg, optimistic: false }
          return next
        }
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      onUpdateLastMessage?.(clubId, 'club', {
        body: msg.message_text, created_at: msg.created_at, sender_name: msg.sender?.name ?? null,
      })
    }
    socket.on('receive_club_message', handleReceiveClubMessage)
    return () => {
      socket.emit('leave_club_room', clubId)
      socket.off('connect', joinClubRoom)
      socket.off('receive_club_message', handleReceiveClubMessage)
    }
  }, [clubId])

  const handleSend = async (text) => {
    if (!text.trim()) return
    const socket = getSocket()
    const optimistic = {
      id: `optimistic-${Date.now()}`, message_text: text, created_at: new Date().toISOString(), is_read: false, is_sent: true,
      sender: { id: user.id, name: user.name }, optimistic: true, replyTo: replyTo,
    }
    setMessages((prev) => [...prev, optimistic])
    socket.emit('send_club_message', { clubId: Number(clubId), message: text, userId: user.id, replyToMessageId: replyTo?.id })
    setReplyTo(null)
  }

  if (loading && messages.length === 0) return <div className="messages-layout__chat-loading"><Spinner /></div>

  return (
    <ChatShell
      header={club ? (
        <Link to={`/clubs/${clubId}`} className="messages-layout__chat-user">
          <div className="messages-layout__club-icon"><Users size={16} /></div>
          <div className="messages-layout__chat-user-info">
            <p className="messages-layout__chat-user-name">{club.name}</p>
            {club.current_book_title && <p className="messages-layout__chat-user-sub">Reading: {club.current_book_title}</p>}
          </div>
        </Link>
      ) : null}
      messages={messages}
      user={user}
      onBack={onBack}
      onSend={handleSend}
      showSenderName={true}
      replyTo={replyTo}
      onSetReply={setReplyTo}
    />
  )
}

const ChatShell = ({ chatId, header, messages, user, onBack, onSend, showSenderName, replyTo, onSetReply }) => {
  const bottomRef = useRef(null)
  const isFirstLoad = useRef(true)

   useEffect(()=>{
    isFirstLoad.current=true
  },[chatId])


  const groupedByDate = messages.reduce((acc, msg) => {
    const date = formatDate(msg.created_at)
    if (!acc[date]) acc[date] = []
    acc[date].push(msg)
    return acc
  }, {})
 
  useLayoutEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      isFirstLoad.current = false
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const scrollToMessage = (messageId) => {
    const el = document.getElementById(`message-${messageId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('message-bubble--selected')
      setTimeout(() => el.classList.remove('message-bubble--selected'), 2000)
    }
  }

  return (
    <div className="messages-layout__chat">
      <div className="messages-layout__chat-header">
        <Button variant="ghost" className="messages-layout__back-btn" onClick={onBack} aria-label="Back to conversations"><ArrowLeft size={16} /></Button>
        {header}
      </div>

      <div className="messages-layout__canvas">
        {Object.entries(groupedByDate).map(([date, msgs]) => (
          <div key={date}>
            <div className="messages-layout__date-sep"><span>{date}</span></div>
            {msgs.map((msg, i) => {
              const isSent = msg.is_sent || msg.sender?.id === user?.id
              const isGrouped = i > 0 && msgs[i - 1].sender?.id === msg.sender?.id
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isSent={isSent}
                  showSender={showSenderName && !isSent}
                  isGrouped={isGrouped}
                  onReply={() => onSetReply(msg)}
                  onReplyClick={scrollToMessage}
                />
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="messages-layout__input-wrap">
        <MessageInput onSend={onSend} replyTo={replyTo} onClearReply={() => onSetReply(null)} />
      </div>
    </div>
  )
}


const ChatPanel = ({ onUpdateLastMessage, conversationId, clubId, type, user, onBack, }) => {
  if (type === 'club') {
    return <ClubChat chatId={clubId} clubId={clubId} user={user} onBack={onBack} onUpdateLastMessage={onUpdateLastMessage} />
  }
  return <PrivateChat chatId={clubId} conversationId={conversationId} user={user} onBack={onBack} onUpdateLastMessage={onUpdateLastMessage} />
}

export default ChatPanel