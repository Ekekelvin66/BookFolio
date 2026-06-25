import { useState, useEffect, useRef } from 'react'
import { useDebouncedValue } from './useDebouncedValue'

export const useUsernameAvailability = (username, currentUsername, checkUsername) => {
  const debouncedUsername = useDebouncedValue(username, 450)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const checkUsernameRef = useRef(checkUsername)
  checkUsernameRef.current = checkUsername

  useEffect(() => {
    const trimmed = debouncedUsername?.trim()

    if (!trimmed || trimmed === currentUsername) {
      setStatus('idle')
      setMessage('')
      return
    }

    let cancelled = false
    setStatus('checking')

    checkUsernameRef.current(trimmed).then((result) => {
      if (!result || cancelled) return
      if (result.success) {
        setStatus(result.data.available ? 'available' : 'taken')
        setMessage(result.data.available ? 'Username is available' : (result.data.reason || 'Username is already taken'))
      } else {
        setStatus('idle')
        setMessage('')
      }
    })

    return () => { cancelled = true }
  }, [debouncedUsername, currentUsername])

  return { status, message }
}