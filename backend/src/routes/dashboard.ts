import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  res.json({ message: 'Dashboard route - coming soon' });
});

export default router;
