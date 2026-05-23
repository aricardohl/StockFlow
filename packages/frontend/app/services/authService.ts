import api from './api';
import { AuthResponse } from '../types';

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/auth', { email, password }).then((r) => r.data);

export const register = (nombre: string, email: string, password: string) =>
  api.post('/user', { nombre, email, password }).then((r) => r.data);
