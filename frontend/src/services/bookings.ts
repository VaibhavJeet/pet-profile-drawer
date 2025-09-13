import axios from 'axios';
import type { Booking } from '../types/response-format';
import toast from 'react-hot-toast';

export const fetchBookings = async (petId: number): Promise<Booking[]> => {
  try {
    const response = await axios.get(`http://localhost:3000/bookings?petId=${petId}`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch bookings');
    throw error;
  }
};