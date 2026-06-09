import express from 'express'
import {getConversations,
    getMessages,
    getNotifications,
    getReviewComments,
    likeReview,
    unlikeReview,
    addReviewComment,
    startConversation,
    sendMessage,
    deleteReviewComment,
    markNotificationRead,
    markAllRead,
    clearAllNotifications,
    muteConversation,
    unmuteConversation,
    deleteConversation
} from '../controllers/socialControllers.js'
import { messageLimiter } from '../middlewares/rateLimiter.js';
const router = express.Router()

router.get('/notifications', getNotifications);
router.patch('/notifications',markAllRead)
router.delete('/notifications', clearAllNotifications)
router.patch('/notifications/:notificationId/read', markNotificationRead);

router.post('/reviews/:reviewId/like', likeReview);
router.delete('/reviews/:reviewId/like', unlikeReview);


router.get('/reviews/:reviewId/comments', getReviewComments);
router.post('/reviews/:reviewId/comment', addReviewComment);
router.delete('/comments/:commentId', deleteReviewComment);


router.get('/conversations', getConversations);
router.post('/conversations', startConversation);
router.get('/conversations/:conversationId', getMessages);
router.post('/conversations/:conversationId/messages',messageLimiter, sendMessage);

router.post('/conversations/:conversationId/mute',muteConversation)
router.delete('/conversations/:conversationId/mute',unmuteConversation)
router.delete('/conversations/:conversationId',deleteConversation)

export default router;