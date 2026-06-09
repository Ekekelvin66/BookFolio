import { useState, useRef, useCallback } from 'react';
import api from '../utils/api'; 

export const useClubFeed = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchFeed = useCallback(async (endpoint, cursor = null, signal) => {
    const params = new URLSearchParams({ limit: 20 });
    if (cursor) params.set('cursor', cursor);
    const { data } = await api.get(`${endpoint}?${params}`, { signal });
    return data;
  }, []);

  const fetchWithAbort = async (requestFn, fallbackMessage) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const data = await requestFn(controller.signal);
      return { success: true, data };
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return { success: false, aborted: true };
      }
      const msg = err.response?.data?.error || err.message || fallbackMessage;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const getActivityFeed = useCallback((clubId, cursor) => 
    fetchWithAbort(
      (signal) => fetchFeed(`/clubs/${clubId}/activity`, cursor, signal),
      'Failed to load social activity stream.'
    ), [fetchFeed]);

  const getBookFeed = useCallback((clubId, cursor) => 
    fetchWithAbort(
      (signal) => fetchFeed(`/clubs/${clubId}/book-feed`, cursor, signal),
      'Failed to load book feed interactions.'
    ), [fetchFeed]);

  return { getActivityFeed, getBookFeed, loading, error };
};