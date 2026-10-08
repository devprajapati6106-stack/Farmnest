import { Router } from 'express';
import { adminOverview, decideFarmhouse, deleteReview, updateUserStatus } from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/overview', adminOverview);
router.patch('/farmhouses/:id/decision', decideFarmhouse);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/reviews/:id', deleteReview);
export default router;
