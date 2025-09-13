import axios from 'axios';
import type { Vaccination } from '../types/response-format';
import toast from 'react-hot-toast';

export const fetchVaccinations = async (petId: number): Promise<Vaccination[]> => {
  try {
    const response = await axios.get(`http://localhost:3000/vaccinations?petId=${petId}`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch vaccinations');
    throw error;
  }
};