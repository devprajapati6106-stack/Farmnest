import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getConversation, ownerInbox, sendMessage } from '../controllers/chatController.js';

const router = Router();
router.use(protect);
router.get('/owner/inbox', authorize('owner'), ownerInbox);
router.get('/:farmhouseId', authorize('user', 'owner'), getConversation);
router.post('/:farmhouseId', authorize('user', 'owner'), sendMessage);
export default router;
