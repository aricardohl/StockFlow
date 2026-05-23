'use client';

import { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Branch } from '../../types';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../../services/branchService';

type BranchPayload = { nombre: string; ubicacion: string };
const emptyForm: BranchPayload = { nombre: '', ubicacion: '' };

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchPayload>(emptyForm);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadBranches = useCallback(async () => {
    try {
      setBranches(await getBranches());
    } catch {
      toast.error('Error al cargar sucursales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBranches(); }, [loadBranches]);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal('create'); };
  const openEdit = (b: Branch) => {
    setEditing(b);
    setForm({ nombre: b.nombre, ubicacion: b.ubicacion });
    setModal('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await createBranch(form);
        toast.success('Sucursal creada');
      } else if (editing) {
        await updateBranch(editing._id, form);
        toast.success('Sucursal actualizada');
      }
      setModal(null);
      loadBranches();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteBranch(confirmId);
      toast.success('Sucursal eliminada');
      setConfirmId(null);
      loadBranches();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Sucursales</h1>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 transition-colors"
          >
            + Nueva Sucursal
          </button>
        </div>

        {loading ? (
          <p className="text-zinc-400 text-sm">Cargando...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  {['Nombre', 'Ubicación', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {branches.map((b) => (
                  <tr key={b._id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium">{b.nombre}</td>
                    <td className="px-4 py-3 text-zinc-500">{b.ubicacion}</td>
                    <td className="px-4 py-3 space-x-3">
                      <button onClick={() => openEdit(b)} className="text-blue-600 hover:underline text-xs">Editar</button>
                      <button onClick={() => setConfirmId(b._id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
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
              {modal === 'create' ? 'Nueva Sucursal' : 'Editar Sucursal'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              {(['nombre', 'ubicacion'] as const).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
                  <input
                    type="text"
                    required
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
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
            <h2 className="text-lg font-semibold mb-2">¿Eliminar sucursal?</h2>
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
