import api from './api';
import { Movement, MovementType, ReportItem } from '../types';

// backend usa 'status' como query param (no 'estado')
export const getMovements = (params?: { status?: string; branch?: string }) =>
  api.get<{ data: Movement[] }>('/movement', { params }).then((r) => r.data.data);

export const getMovement = (id: string) =>
  api.get<{ data: Movement }>(`/movement/${id}`).then((r) => r.data.data);

export const createMovement = (data: {
  producto: string;
  origen?: string;
  destino?: string;
  tipo: MovementType;
  cantidad: number;
}) => api.post<{ data: { id: string; estado: string } }>('/movement', data).then((r) => r.data);

export const getReport = (startDate: string, endDate: string) =>
  api.get<{ data: ReportItem[] }>('/movement/report', { params: { startDate, endDate } }).then((r) => r.data.data);
