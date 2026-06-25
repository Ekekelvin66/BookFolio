import express from 'express';
import { getBestsellers } from '../controllers/BestsellerController.js';

const router = express.Router();

router.get('/bestsellers', getBestsellers);

export default router;
