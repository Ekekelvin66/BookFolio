import express from 'express'
import {getGuestHomeEssential,getGuestHomeExtended,getAuthHomeEssential, getAuthHomeExtended,getEditorsPicks} from '../controllers/HomeController.js'
import { requireAuth } from '../middlewares/requireAuth.js'
const router = express.Router()


router.get('/home/guest/essential', getGuestHomeEssential)
router.get('/home/guest/extended', getGuestHomeExtended)
router.get('/home/user/essential', requireAuth, getAuthHomeEssential)
router.get('/home/user/extended', requireAuth, getAuthHomeExtended)
router.get('/editors-picks', getEditorsPicks);

export default router;