import express from 'express'
import {unlikeComment,getReplies,likeComment,deleteComment,replyComment
} from '../controllers/commentController.js'

const router =express.Router()

router.get('/reviews/:reviewId/comments/:commentId/',getReplies)
router.post('/reviews/:reviewId/comments/:commentId/reply',replyComment)
router.post('/reviews/:reviewId/comments/:commentId/like',likeComment)
router.delete('/reviews/:reviewId/comments/:commentId/like',unlikeComment)
router.delete('/reviews/:reviewId/comments/:commentId',deleteComment)


export default router;