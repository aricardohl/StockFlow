'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Product, Branch, MovementType } from '../types';
import { createMovement } from '../services/movementService';

interface Props {
  products: Product[];
  branches: Branch[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function MovementForm({ products, branches, onSuccess, onClose }: Props) {
  const [tipo, setTipo] = useState<MovementType>('ENTRADA');
  const [producto, setProducto] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto || cantidad < 1) return;
    setLoading(true);
    try {
      await createMovement({
        tipo,
        producto,
        ...(tipo !== 'ENTRADA' && origen ? { origen } : {}),
        ...(tipo !== 'SALIDA' && destino ? { destino } : {}),
        cantidad,
      });
      toast.success('Movimiento en cola');
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al crear movimiento';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Nuevo Movimiento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as MovementType)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="TRANSACCION_SUC">Transferencia entre sucursales</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Producto</label>
            <select
              required
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              <option value="">Seleccionar...</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.nombre} ({p.sku})</option>
              ))}
            </select>
          </div>

          {tipo !== 'ENTRADA' && (
            <div>
              <label className="block text-sm font-medium mb-1">Sucursal origen</label>
              <select
                required
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                <option value="">Seleccionar...</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {tipo !== 'SALIDA' && (
            <div>
              <label className="block text-sm font-medium mb-1">Sucursal destino</label>
              <select
                required
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                <option value="">Seleccionar...</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <input
              type="number"
              min={1}
              required
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-md hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
