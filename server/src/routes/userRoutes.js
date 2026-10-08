import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import { changePassword, getProfile, markNotificationsRead, notifications, toggleFavorite, updateProfile, wishlist } from '../controllers/userController.js';

const router = Router();
router.use(protect, authorize('user', 'owner', 'admin'));
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.get('/wishlist', authorize('user'), wishlist);
router.patch('/wishlist/:farmhouseId', authorize('user'), toggleFavorite);
router.get('/notifications', notifications);
router.patch('/notifications/read', markNotificationsRead);
export default router;
