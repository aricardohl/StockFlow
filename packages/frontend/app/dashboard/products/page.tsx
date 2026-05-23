'use client';

import { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Product } from '../../types';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/productService';

type ProductPayload = { sku: string; nombre: string; precio: number; categoria: string };
const emptyForm: ProductPayload = { sku: '', nombre: '', precio: 0, categoria: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductPayload>(emptyForm);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await getProducts());
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal('create'); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ sku: p.sku, nombre: p.nombre, precio: p.precio, categoria: p.categoria });
    setModal('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await createProduct(form);
        toast.success('Producto creado');
      } else if (editing) {
        await updateProduct(editing._id, { nombre: form.nombre, precio: form.precio, categoria: form.categoria });
        toast.success('Producto actualizado');
      }
      setModal(null);
      loadProducts();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteProduct(confirmId);
      toast.success('Producto eliminado');
      setConfirmId(null);
      loadProducts();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Productos</h1>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 transition-colors"
          >
            + Nuevo Producto
          </button>
        </div>

        {loading ? (
          <p className="text-zinc-400 text-sm">Cargando...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  {['SKU', 'Nombre', 'Categoría', 'Precio', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.sku}</td>
                    <td className="px-4 py-3 font-medium">{p.nombre}</td>
                    <td className="px-4 py-3 text-zinc-500">{p.categoria}</td>
                    <td className="px-4 py-3">${p.precio.toFixed(2)}</td>
                    <td className="px-4 py-3 space-x-3">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-xs">Editar</button>
                      <button onClick={() => setConfirmId(p._id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {modal === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              {([
                { key: 'sku', label: 'SKU', type: 'text', readonly: modal === 'edit' },
                { key: 'nombre', label: 'Nombre', type: 'text' },
                { key: 'categoria', label: 'Categoría', type: 'text' },
                { key: 'precio', label: 'Precio', type: 'number' },
              ] as const).map(({ key, label, type, readonly }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type={type}
                    required
                    readOnly={readonly}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 read-only:bg-zinc-100"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm border rounded-md hover:bg-zinc-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-md hover:bg-zinc-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación de eliminación */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-2">¿Eliminar producto?</h2>
            <p className="text-sm text-zinc-500 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm border rounded-md hover:bg-zinc-50">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
