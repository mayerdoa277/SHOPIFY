import express from 'express';
import { userAuth } from '../middleware/auth.middleware.js';
import { register, logIn, logOut, getAllUsers } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', logIn);
router.post('/logout', logOut);
router.get('/users', userAuth, getAllUsers);

export default router;