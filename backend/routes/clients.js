import express from 'express';
import { clients } from '../utils/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(clients);
});

export default router;