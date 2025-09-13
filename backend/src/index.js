import express from 'express';
import clientRoutes from '../routes/clients.js';
import petRoutes from '../routes/pets.js';
import vaccinationRoutes from '../routes/vaccinations.js';
import groomingRoutes from '../routes/grooming.js';
import bookingRoutes from '../routes/bookings.js';
import photoRoutes from '../routes/photos.js';
import { loadDb } from '../utils/db.js';
import errorSimulator from '../middleware/errorSimulator.js';
import errorHandler from '../middleware/errorHandler.js';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// loading data
loadDb();

// middleware
app.use(errorSimulator);
app.use('/clients', clientRoutes);
app.use('/pets', petRoutes);
app.use('/vaccinations', vaccinationRoutes);
app.use('/grooming', groomingRoutes);
app.use('/bookings', bookingRoutes);
app.use('/photos', photoRoutes);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});