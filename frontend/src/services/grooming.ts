import axios from 'axios';
import type { Grooming } from '../types/response-format';
import toast from 'react-hot-toast';

export const fetchGrooming = async (petId: number): Promise<Grooming[]> => {
  try {
    const response = await axios.get(`http://localhost:3000/grooming?petId=${petId}`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch grooming');
    throw error;
  }
};