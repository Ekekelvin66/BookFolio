import { useState,useRef } from "react";
import api from "../utils/api";
import axios from "axios";

export const useBooks = ()=>{
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
            if(axios.isCancel(err)){
                return { success: false, error: 'aborted_by_react' };
            }
            const msg = err.response?.data?.message ||err.response?.data?.error || err.message || fallbackMessage || 'Something went wrong'
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setLoading(false)
        }
    }
const searchBooks = (query,genre,page=1)=>handleRequest((signal)=> api.get(`/books/search?query=${query??''}${genre? `&genre=${genre}`:''}&page=${page}`,{signal}),'Failed to search Books')
const getBook = (bookId)=>handleRequest((signal)=>api.get(`/books/${bookId}`,{signal}),'Failed to load Book Details')
const addToShelf = (bookData)=>handleRequest((signal)=>api.post(`/shelves`,bookData,{signal}),'Failed to add to Shelf')
const updateShelf = (bookId,status)=>handleRequest((signal)=>api.patch(`/shelves/${bookId}/status`,{status},{signal}),'Failed to Change status')
const removeFromShelf = (bookId) => handleRequest((signal) => api.delete(`/shelves/${bookId}`,{signal}), 'Failed to remove from shelf')
const updateProgress = (bookId,current_page)=>handleRequest((signal)=>api.patch(`/dashboard/${bookId}/progress`,{current_page},{signal}),'Failed to update reading progress')
return {
    loading,
    error,
    searchBooks,
    getBook,
    addToShelf,
    updateShelf,
    removeFromShelf,
    updateProgress

}
}