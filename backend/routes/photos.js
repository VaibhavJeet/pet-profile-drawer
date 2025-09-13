import express from "express";
import { pets } from "../utils/db.js";

const router = express.Router();

router.post("/upload", (req, res) => {
  const { petId } = req.body;
  const pet = pets.find((p) => p.id === parseInt(petId));
  if (pet) {
    const photoUrl = `/seed/${Date.now()}.png`;
    if (!pet.photos) pet.photos = [];
    pet.photos.push(photoUrl);
    res.json({ url: photoUrl });
  } else {
    res.status(404).json({ error: "Pet not found" });
  }
});

router.delete('/:prefix/:photoUrl', (req, res) => {
  const { prefix, photoUrl } = req.params;
  const fullPhotoUrl = `/${prefix}/${photoUrl}`;
  const pet = pets.find(p => p.photos && p.photos.includes(fullPhotoUrl));
  if (pet) {
    pet.photos = pet.photos.filter(photo => photo !== fullPhotoUrl);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
});

export default router;
