'use client';

import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { ReportItem } from '../../types';
import { getReport } from '../../services/movementService';

const TYPE_LABEL: Record<string, string> = {
  ENTRADA:         'Entrada',
  SALIDA:          'Salida',
  TRANSACCION_SUC: 'Transferencia',
};

export default function ReportsPage() {
  const [report, setReport] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getReport(startDate, endDate);
      setReport(data);
      setGenerated(true);
    } catch {
      toast.error('Error al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Reporte de Movimientos</h1>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1 text-zinc-600">Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-zinc-600">Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Generando...' : 'Generar'}
          </button>
        </div>

        {generated && (
          <>
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
                  {report.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                        Sin resultados para el rango seleccionado
                      </td>
                    </tr>
                  ) : (
                    report.map((r, i) => (
                      <tr key={i} className="hover:bg-zinc-50">
                        <td className="px-4 py-3">{TYPE_LABEL[r.tipo] ?? r.tipo}</td>
                        <td className="px-4 py-3">{r.sucursal}</td>
                        <td className="px-4 py-3">{r.totalMovimientos}</td>
                        <td className="px-4 py-3 font-semibold">{r.cantidadTotal}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {report.length > 0 && (
              <p className="text-xs text-zinc-400">{report.length} grupo{report.length !== 1 ? 's' : ''} encontrado{report.length !== 1 ? 's' : ''}</p>
            )}
          </>
        )}
      </div>
    </>
  );
}
