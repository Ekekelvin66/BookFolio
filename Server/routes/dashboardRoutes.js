import express from 'express'
import {getDashboard,
    getShelves,
    addToShelf,
    removeFromShelf,
    updateShelfStatus,
    UpdateProgress,
} from '../controllers/dashboardController.js'
const router = express.Router()

router.get('/dashboard',getDashboard)
router.get('/shelves',getShelves)
router.post('/shelves',addToShelf)
router.delete('/shelves/:bookId',removeFromShelf)
router.patch('/shelves/:bookId/status',updateShelfStatus)
router.patch('/dashboard/:bookId/progress',UpdateProgress)
export default router