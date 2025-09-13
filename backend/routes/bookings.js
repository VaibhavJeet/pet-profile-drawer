import express from 'express';
import { bookings } from '../utils/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { petId } = req.query;
  const filteredBookings = petId ? bookings.filter(b => b.petId === parseInt(petId)) : bookings;
  res.json(filteredBookings);
});

export default router;