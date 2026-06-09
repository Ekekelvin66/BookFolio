import express from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'
import {
  getClubGenres,
  getClubs,
  getMyClubs,
  getClub,
  createClub,
  editClubInfo,
  deleteClub,
  joinClub,
  leaveClub,
  requestToJoin,
  getJoinRequests,
  approveRequest,
  rejectRequest,
  transferOwnership,
  removeMember,
  getClubMessages,
  sendClubMessage,
  addToReadingList,
  removeFromReadingList,
  updateCurrentBook,
  updateCurrentChapter,
  muteClub,
  unmuteClub
} from '../controllers/bookClubController.js'
import { uploadClubCover } from '../config/cloudinary.js';
import { getClubActivityFeed, getClubBookFeed } from '../controllers/clubFeedController.js';
const router = express.Router()

router.use(requireAuth)

router.get('/clubs/genres', getClubGenres)
router.get('/clubs', getClubs)
router.get('/clubs/mine', getMyClubs)
router.get('/clubs/:clubId', getClub)


router.post('/clubs', uploadClubCover.single('image'),createClub)
router.patch('/clubs/:clubId',uploadClubCover.single('image'),editClubInfo)
router.delete('/clubs/:clubId', deleteClub)
router.patch('/clubs/:clubId/transfer', transferOwnership)


router.post('/clubs/:clubId/join', joinClub)
router.delete('/clubs/:clubId/leave', leaveClub)
router.delete('/clubs/:clubId/members/:memberId', removeMember)


router.post('/clubs/:clubId/request', requestToJoin)
router.get('/clubs/:clubId/requests', getJoinRequests)
router.patch('/clubs/:clubId/requests/:requestUserId/approve', approveRequest)
router.patch('/clubs/:clubId/requests/:requestUserId/reject', rejectRequest)


router.get('/clubs/:clubId/messages', getClubMessages)
router.post('/clubs/:clubId/messages', sendClubMessage)



router.post('/clubs/:clubId/mute',muteClub)
router.delete('/clubs/:clubId',unmuteClub)


router.post('/clubs/:clubId/books', addToReadingList)
router.delete('/clubs/:clubId/books/:bookId', removeFromReadingList)
router.patch('/clubs/:clubId/reading/:bookId/current', updateCurrentBook)
router.patch('/clubs/:clubId/reading/current/chapter', updateCurrentChapter)

router.get('/clubs/:clubId/activity', getClubActivityFeed);
router.get('/clubs/:clubId/book-feed', getClubBookFeed)

export default router