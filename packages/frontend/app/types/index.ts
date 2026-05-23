export interface Product {
  _id: string;
  sku: string;
  nombre: string;
  precio: number;
  categoria: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  _id: string;
  nombre: string;
  ubicacion: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stock {
  _id: string;
  producto: Product;
  sucursal: Branch;
  cantidad: number;
}

export type MovementType = 'ENTRADA' | 'SALIDA' | 'TRANSACCION_SUC';
export type MovementStatus = 'pending' | 'processed' | 'failed';

export interface Movement {
  _id: string;
  producto: Product | string;
  origen: Branch | string | null;
  destino: Branch | string | null;
  tipo: MovementType;
  cantidad: number;
  estado: MovementStatus;
  intentos: number;
  mensajeError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportItem {
  tipo: string;
  sucursal: string;
  totalMovimientos: number;
  cantidadTotal: number;
}

export interface User {
  id: string;
  nombre: string;
  email: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  user: User;
}


