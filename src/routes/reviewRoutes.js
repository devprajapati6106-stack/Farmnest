import { Router } from 'express';
import { createReview, listReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/:farmhouseId', listReviews);
router.post('/:farmhouseId', protect, createReview);

export default router;
