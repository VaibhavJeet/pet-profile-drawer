import express from 'express';
import { grooming } from '../utils/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { petId } = req.query;
  const filteredGrooming = petId ? grooming.filter(g => g.petId === parseInt(petId)) : grooming;
  res.json(filteredGrooming);
});

export default router;