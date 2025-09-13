import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let clients = [];
let pets = [];
let vaccinations = [];
let grooming = [];
let bookings = [];

export const loadDb = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dataDir = path.join(__dirname, '../../data');
  clients = JSON.parse(fs.readFileSync(path.join(dataDir, 'clients.json'), 'utf-8'));
  pets = JSON.parse(fs.readFileSync(path.join(dataDir, 'pets.json'), 'utf-8'));
  vaccinations = JSON.parse(fs.readFileSync(path.join(dataDir, 'vaccinations.json'), 'utf-8'));
  grooming = JSON.parse(fs.readFileSync(path.join(dataDir, 'grooming.json'), 'utf-8'));
  bookings = JSON.parse(fs.readFileSync(path.join(dataDir, 'bookings.json'), 'utf-8'));
};

export { clients, pets, vaccinations, grooming, bookings };