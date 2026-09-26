import express from 'express';
import { getAllUsers, getUserById, updateUser, toggleUserStatus } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('administrator', 'municipal_staff'), getAllUsers);
router.get('/:id', protect, getUserById);
router.patch('/:id', protect, updateUser);
router.patch('/:id/toggle-status', protect, authorizeRoles('administrator'), toggleUserStatus);

export default router;
