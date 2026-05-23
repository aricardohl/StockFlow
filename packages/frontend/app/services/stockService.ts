import api from './api';
import { Stock } from '../types';

export const getStock = async (params?: { product?: string; branch?: string }) =>{
  const data = api.get<{ data: Stock[] }>('/stock', { params }).then((r) => r.data.data);
  console.log('Fetched stock data:', await data);
  return data;
}
