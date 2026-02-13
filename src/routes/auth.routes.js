import express from 'express';
import { body } from 'express-validator';
import { userAuth } from '../middleware/auth.middleware.js';
import { register, logIn, logOut, getAllUsers } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', [
    body('email').isEmail().withMessage('Invalid email'),
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'artist']).withMessage('Role must be either user or artist')
], register);

router.post('/login', [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], logIn);

router.post('/logout', logOut);
router.get('/users', userAuth, getAllUsers);

export default router;