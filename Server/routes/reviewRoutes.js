import express from 'express'
import {
    addReview, 
    editReview, 
    deleteReview,
    toggleHelpful 
} from '../controllers/reviewController.js'
const router = express.Router();


router.post('/books/:bookId/reviews',addReview);
router.patch('/books/:bookId/reviews/:reviewId',editReview);
router.delete('/books/:bookId/reviews/:reviewId',deleteReview);
router.post('/reviews/:reviewId/helpful', toggleHelpful)


export default router;