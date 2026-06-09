import { useState,useRef } from "react";
import api from "../utils/api";

export const useBookClubs = ()=>{
    const [loading,setLoading]= useState(false)
    const [error,setError]=useState(null)
    const abortRef = useRef(null)

    const handleRequest = async (requestFn, fallbackMessage) => {
        setLoading(true)
        setError(null)
        if (abortRef.current) {
            abortRef.current.abort()
        }
        const controller = new AbortController()
        abortRef.current = controller
        try {
            const { data } = await requestFn(controller.signal)
            return { success: true, data }
        } catch (err) {
            const msg =err.response?.data?.error  ||err.response?.data?.message|| err.message || fallbackMessage || 'Something went wrong';
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setLoading(false)
        }
    }
  const getClubs = (genre, search) => handleRequest(
  (s) => api.get(`/clubs?${new URLSearchParams({
    ...(genre  && { genre }),
    ...(search && { search }),
  })}`, { signal: s }),
  'Failed to load clubs'
)
  const getMyClubs     = ()            => handleRequest((s) => api.get('/clubs/mine', { signal: s }), 'Failed to load your clubs')
  const getClub        = (clubId)      => handleRequest((s) => api.get(`/clubs/${clubId}`, { signal: s }), 'Failed to load club')
  const getClubGenres  = ()            => handleRequest((s) => api.get('/clubs/genres', { signal: s }), 'Failed to load genres')
  const createClub     = (data)        => handleRequest((s) => api.post('/clubs', data, { signal: s }), 'Failed to create club')
  const editClub       = (clubId, data)=> handleRequest((s) => api.patch(`/clubs/${clubId}`, data, { signal: s,  }), 'Failed to update club')
  const deleteClub     = (clubId)      => handleRequest((s) => api.delete(`/clubs/${clubId}`, { signal: s }), 'Failed to delete club')
  const joinClub       = (clubId)      => handleRequest((s) => api.post(`/clubs/${clubId}/join`, {}, { signal: s }), 'Failed to join club')
  const leaveClub      = (clubId)      => handleRequest((s) => api.delete(`/clubs/${clubId}/leave`, { signal: s }), 'Failed to leave club')
  const requestToJoin  = (clubId)      => handleRequest((s) => api.post(`/clubs/${clubId}/request`, {}, { signal: s }), 'Failed to send join request')
  const transferOwnership = (clubId, newOwnerId) => handleRequest((s) => api.patch(`/clubs/${clubId}/transfer`, { newOwnerId }, { signal: s }), 'Failed to transfer ownership')
  const removeMember   = (clubId, memberId) => handleRequest((s) => api.delete(`/clubs/${clubId}/members/${memberId}`, { signal: s }), 'Failed to remove member')
  const getJoinRequests = (clubId)     => handleRequest((s) => api.get(`/clubs/${clubId}/requests`, { signal: s }), 'Failed to load requests')
  const approveRequest = (clubId, userId) => handleRequest((s) => api.patch(`/clubs/${clubId}/requests/${userId}/approve`, {}, { signal: s }), 'Failed to approve request')
  const rejectRequest  = (clubId, userId) => handleRequest((s) => api.patch(`/clubs/${clubId}/requests/${userId}/reject`, {}, { signal: s }), 'Failed to reject request')
  const getClubMessages = (clubId, before = null) => {
    console.log(`[useClubs] getClubMessages called: clubId=${clubId}, before=${before}`);
    return handleRequest((s) => {
        console.log(`[useClubs] API call: /clubs/${clubId}/messages, params: ${JSON.stringify({ before })}`);
        return api.get(`/clubs/${clubId}/messages`, { params: { before }, signal: s })
    }, 'Failed to load messages')
  }
  const sendClubMessage = (clubId, message_text) => handleRequest((s) => api.post(`/clubs/${clubId}/messages`, { message_text }, { signal: s }), 'Failed to send message')
  const getClubActivity = (clubId)     => handleRequest((s) => api.get(`/clubs/${clubId}/activity`, { signal: s }), 'Failed to load activity')
  const addToReadingList = (clubId, bookData) => handleRequest((s) => api.post(`/clubs/${clubId}/reading-list`, bookData, { signal: s }), 'Failed to add book')
  const removeFromReadingList = (clubId, bookId) => handleRequest((s) => api.delete(`/clubs/${clubId}/reading-list/${bookId}`, { signal: s }), 'Failed to remove book')
  const updateCurrentBook = (clubId, bookId, data) => handleRequest((s) => api.patch(`/clubs/${clubId}/reading-list/${bookId}/current`, data, { signal: s }), 'Failed to update current book')
  const updateCurrentChapter = (clubId, data) => handleRequest((s) => api.patch(`/clubs/${clubId}/chapter`, data, { signal: s }), 'Failed to update chapter')
  const muteClub         = (clubId)  => handleRequest((s) => api.post(`/clubs/${clubId}/mute`, {}, { signal: s }), 'Failed to mute club')
  const unmuteClub       = (clubId)   => handleRequest((s) => api.delete(`/clubs/${clubId}/mute`, { signal: s }), 'Failed to unmute club')
 
  return {
    loading, error,
    getClubs, getMyClubs, getClub, getClubGenres,
    createClub, editClub, deleteClub,
    joinClub, leaveClub, requestToJoin,
    transferOwnership, removeMember,
    getJoinRequests, approveRequest, rejectRequest,
    getClubMessages, sendClubMessage,
    getClubActivity,
    addToReadingList, removeFromReadingList,
    updateCurrentBook, updateCurrentChapter,
    muteClub,unmuteClub
  }    
}