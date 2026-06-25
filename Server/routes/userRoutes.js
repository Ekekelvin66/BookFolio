import express from 'express'
import { 
    updateProfile,
    removeAvatar,
    updatePreferences,
    savePreferences,
    setReadingGoal,
    getPreferences,
    getProfile,
    getPublicProfile,
    checkUsername} from '../controllers/UserController.js'
    import { uploadAvatar } from '../config/cloudinary.js';
const router=express.Router();




router.get('/user',getProfile)
router.patch('/user',uploadAvatar.single('image'),updateProfile)
router.delete('/user/avatar', removeAvatar)
router.post('/user/yearly-goal',setReadingGoal)
router.get('/user/preferences',getPreferences)
router.post('/user/preferences',savePreferences)
router.patch('/user/preferences',updatePreferences)
router.get('/users/:userId', getPublicProfile)
router.get('/user/check-username',checkUsername);
export default router