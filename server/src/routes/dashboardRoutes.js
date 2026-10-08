import { Router } from 'express';
import { ownerDashboard, userDashboard } from '../controllers/dashboardController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.get('/owner', protect, authorize('owner', 'admin'), ownerDashboard);
router.get('/user', protect, authorize('user'), userDashboard);

export default router;
