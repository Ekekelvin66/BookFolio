import express from "express";
import {
    searchBooks,
    getAllBooks, 
    getBook,  
    addBook
} from '../controllers/bookController.js'
import {getGenre,getGenres} from '../controllers/genreController.js'
import { requireAuth } from "../middlewares/requireAuth.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
const router=express.Router();

router.get('/books',getAllBooks)
router.get('/genres',getGenres)
router.post('/books/add',requireAuth,addBook)
router.get('/books/search',searchBooks)
router.get('/books/:bookId',optionalAuth,getBook)
router.get('/genres/:genreName', getGenre)


export default router