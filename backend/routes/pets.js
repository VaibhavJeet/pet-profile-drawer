import express from 'express';
import { pets } from '../utils/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { clientId } = req.query;
  const filteredPets = clientId ? pets.filter(pet => pet.clientId === parseInt(clientId)) : pets;
  res.json(filteredPets);
});

router.get('/:id', (req, res) => {
  const pet = pets.find(p => p.id === parseInt(req.params.id));
  if (pet) res.json(pet);
  else res.status(404).json({ error: 'Pet not found' });
});

router.put('/:id', (req, res) => {
  const petIndex = pets.findIndex(p => p.id === parseInt(req.params.id));
  if (petIndex !== -1) {
    pets[petIndex] = { ...pets[petIndex], ...req.body };
    res.json(pets[petIndex]);
  } else {
    res.status(404).json({ error: 'Pet not found' });
  }
});

export default router;