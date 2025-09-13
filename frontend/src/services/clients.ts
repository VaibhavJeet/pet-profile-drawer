import axios from 'axios';
import type { Client } from '../types/response-format';
import toast from 'react-hot-toast';


export const fetchClients = async (): Promise<Client[]> => {
  try {
    const response = await axios.get('http://localhost:3000/clients');
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch clients');
    throw error;
  }
};
