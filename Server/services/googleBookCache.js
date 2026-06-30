import { searchGoogleBooks as _search } from './googleBooks.js'

const CACHE_TTL   = 10 * 60 * 1000
const RETRY_DELAY = 1000
const MIN_GAP     = 300

const cache = new Map()
const inFlight = new Map()
let lastRequestAt = 0

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const enforceGap = async () => {
  const now  = Date.now()
  const gap  = now - lastRequestAt
  if (gap < MIN_GAP) await wait(MIN_GAP - gap)
  lastRequestAt = Date.now()
}

const fetchWithRetry = async (query, genre, startIndex,maxResults) => {
  await enforceGap()
  try {
    return await _search(query, genre, startIndex,maxResults)
  } catch (err) {
    const status = err?.response?.status
    if (status === 429) {
      await wait(RETRY_DELAY)
      await enforceGap()
      return await _search(query, genre, startIndex,maxResults)
    }
    throw err
  }
}

export const searchBooks = async (query = '', genre = '', startIndex = 0,maxResults = 10) => {
  const key = `${query}||${genre}||${startIndex}||${maxResults}`

  const cached = cache.get(key)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data
  }

  if (inFlight.has(key)) {
    return inFlight.get(key)
  }

  const promise = fetchWithRetry(query, genre, startIndex)
    .then((data) => {
      cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL })
      inFlight.delete(key)
      return data
    })
    .catch((err) => {
      inFlight.delete(key)
      console.error(`[GoogleBooks] Failed for "${key}":`, err.message)
      return []
    })

  inFlight.set(key, promise)
  return promise
}

export const clearBookCache = () => cache.clear()