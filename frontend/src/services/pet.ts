import axios from 'axios';
import type { Pet } from '../types/response-format';
import toast from 'react-hot-toast';

export const fetchPet = async (petId: number): Promise<Pet> => {
  try {
    const response = await axios.get(`http://localhost:3000/pets/${petId}`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch pet');
    throw error;
  }
};

export const fetchPets = async (): Promise<Pet[]> => {
  try {
    const response = await axios.get('http://localhost:3000/pets');
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch pets');
    throw error;
  }
};
