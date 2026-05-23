import api from './api';
import { Branch } from '../types';

type BranchPayload = Omit<Branch, '_id' | 'createdAt' | 'updatedAt'>;

export const getBranches = () =>
  api.get<{ data: Branch[] }>('/branch').then((r) => r.data.data);

export const createBranch = (data: BranchPayload) =>
  api.post<{ data: Branch }>('/branch', data).then((r) => r.data.data);

export const updateBranch = (id: string, data: Partial<BranchPayload>) =>
  api.put<{ data: Branch }>(`/branch/${id}`, data).then((r) => r.data.data);

export const deleteBranch = (id: string) =>
  api.delete(`/branch/${id}`).then((r) => r.data);
