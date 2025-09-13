import express from 'express';
import { vaccinations } from '../utils/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { petId } = req.query;
  const filteredVaccinations = petId ? vaccinations.filter(v => v.petId === parseInt(petId)) : vaccinations;
  res.json(filteredVaccinations);
});

router.post('/', (req, res) => {
  const newVaccination = { id: Date.now(), ...req.body };
  vaccinations.push(newVaccination);
  res.status(201).json(newVaccination);
});

export default router;