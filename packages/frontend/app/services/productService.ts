import api from './api';
import { Product } from '../types';

type ProductPayload = Omit<Product, '_id' | 'createdAt' | 'updatedAt'>;

export const getProducts = () =>
  api.get<{ data: Product[] }>('/product').then((r) => r.data.data);

export const createProduct = (data: ProductPayload) =>
  api.post<{ data: Product }>('/product', data).then((r) => r.data.data);

export const updateProduct = (id: string, data: Partial<ProductPayload>) =>
  api.put<{ data: Product }>(`/product/${id}`, data).then((r) => r.data.data);

export const deleteProduct = (id: string) =>
  api.delete(`/product/${id}`).then((r) => r.data);
