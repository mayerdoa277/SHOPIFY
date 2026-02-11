import express from 'express';
import { register, logIn, logOut, getAllUsers } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', logIn);
router.post('/logout', logOut);
router.get('/users', getAllUsers);

export default router;