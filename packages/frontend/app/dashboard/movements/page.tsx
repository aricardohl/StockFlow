'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { Movement, Branch, MovementStatus, ReportItem } from '../../types';
import { getMovements, getMovement, getReport } from '../../services/movementService';
import { getBranches } from '../../services/branchService';
import { usePolling } from '../../hooks/usePolling';

const STATUS_BADGE: Record<MovementStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  processed: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-700',
};

const TYPE_LABEL: Record<string, string> = {
  ENTRADA:         'Entrada',
  SALIDA:          'Salida',
  TRANSACCION_SUC: 'Transferencia',
};

function getName(val: Movement['producto'] | Movement['origen']): string {
  if (!val) return '-';
  if (typeof val === 'object' && 'nombre' in val) return (val as { nombre: string }).nombre;
  return '-';
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [detail, setDetail] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportItem[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const hasPending = movements.some((m) => m.estado === 'pending');

  const fetchMovements = useCallback(async () => {
    try {
      const params: { status?: string; branch?: string } = {};
      if (statusFilter) params.status = statusFilter;
      if (branchFilter) params.branch = branchFilter;
      const data = await getMovements(params);
      setMovements(data);
    } catch {
      toast.error('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, branchFilter]);

  useEffect(() => {
    getBranches().then(setBranches).catch(() => {});
    fetchMovements();
  }, [fetchMovements]);

  // Polling cada 0.5 s mientras haya movimientos pendientes
  usePolling(fetchMovements, 1000, true);

  const openDetail = async (id: string) => {
    try {
      setDetail(await getMovement(id));
    } catch {
      toast.error('Error al cargar detalle');
    }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      setReport(await getReport(startDate, endDate));
    } catch {
      toast.error('Error al generar reporte');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="space-y-8">

        {/* ─── Tabla de movimientos ─── */}
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Movimientos</h1>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="processed">Procesado</option>
              <option value="failed">Fallido</option>
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              <option value="">Todas las sucursales</option>
              {branches.map((b) => <option key={b._id} value={b._id}>{b.nombre}</option>)}
            </select>
          </div>

          {loading ? (
            <p className="text-zinc-400 text-sm">Cargando...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    {['Tipo', 'Producto', 'Origen', 'Destino', 'Cantidad', 'Estado', 'Fecha'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-zinc-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {movements.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400">Sin movimientos</td></tr>
                  ) : movements.map((m) => (
                    <tr
                      key={m._id}
                      className="hover:bg-zinc-50 cursor-pointer"
                      onClick={() => openDetail(m._id)}
                    >
                      <td className="px-4 py-3">{TYPE_LABEL[m.tipo] ?? m.tipo}</td>
                      <td className="px-4 py-3">{getName(m.producto)}</td>
                      <td className="px-4 py-3 text-zinc-500">{getName(m.origen)}</td>
                      <td className="px-4 py-3 text-zinc-500">{getName(m.destino)}</td>
                      <td className="px-4 py-3">{m.cantidad}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[m.estado]}`}>
                          {m.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {format(new Date(m.createdAt), 'dd/MM/yy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Reporte por rango de fechas ─── */}
        <div className="space-y-4 border-t border-zinc-200 pt-6">
          <h2 className="text-lg font-semibold">Reporte por rango de fechas</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium mb-1 text-zinc-600">Desde</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-zinc-600">Hasta</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500" />
            </div>
            <button
              onClick={fetchReport}
              disabled={reportLoading}
              className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {reportLoading ? 'Generando...' : 'Generar'}
            </button>
          </div>

          {report.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    {['Tipo', 'Sucursal', 'Movimientos', 'Cantidad Total'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-zinc-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {report.map((r, i) => (
                    <tr key={i} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">{TYPE_LABEL[r.tipo] ?? r.tipo}</td>
                      <td className="px-4 py-3">{r.sucursal}</td>
                      <td className="px-4 py-3">{r.totalMovimientos}</td>
                      <td className="px-4 py-3 font-semibold">{r.cantidadTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── Modal detalle ─── */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold">Detalle del Movimiento</h2>
            <div className="space-y-2 text-sm">
              {([
                ['Tipo',     TYPE_LABEL[detail.tipo] ?? detail.tipo],
                ['Estado',   detail.estado],
                ['Producto', getName(detail.producto)],
                ['Origen',   getName(detail.origen)],
                ['Destino',  getName(detail.destino)],
                ['Cantidad', String(detail.cantidad)],
                ['Intentos', String(detail.intentos)],
                ['Creado',   format(new Date(detail.createdAt), 'dd/MM/yyyy HH:mm')],
              ] as [string, string][]).map(([k, v]) => (
                <Fragment key={k}>
                  <div className="flex gap-2">
                    <span className="text-zinc-500 w-24 shrink-0">{k}:</span>
                    <span className="font-medium">{v}</span>
                  </div>
                </Fragment>
              ))}
              {detail.mensajeError && (
                <div className="mt-2">
                  <p className="text-zinc-500 text-xs mb-1">Error:</p>
                  <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-md">{detail.mensajeError}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-1">
              <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm border rounded-md hover:bg-zinc-50">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
