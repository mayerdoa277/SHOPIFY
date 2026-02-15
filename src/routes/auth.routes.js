import express from 'express';
import { body } from 'express-validator';
import { userAuth, authenticateUser } from '../middleware/auth.middleware.js';
import { register, logIn, logOut, getAllUsers, getAllRegularUsers, getAllArtists, deleteUserAccount } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', [
    body('email').isEmail().withMessage('Invalid email'),
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'artist', 'admin']).withMessage('Role must be user, artist, or admin')
], register);

router.post('/login', [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], logIn);

router.post('/logout', logOut);
router.get('/users', authenticateUser, getAllUsers);
router.get('/artists', authenticateUser, getAllArtists);
router.get('/regular-users', authenticateUser, getAllRegularUsers);
router.delete('/delete-user/:id', authenticateUser, deleteUserAccount);


export default router;