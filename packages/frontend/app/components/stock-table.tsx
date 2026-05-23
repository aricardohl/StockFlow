'use client';

import { useState, useRef, useEffect } from 'react';
import { Stock, Branch, Product } from '../types';

interface Props {
  stocks: Stock[];
  branches: Branch[];
  products: Product[];
  selectedBranch: string;
  selectedProduct: string;
  onBranchChange: (id: string) => void;
  onProductChange: (id: string) => void;
}

interface ComboboxOption { id: string; label: string; }

function Combobox({
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
}: {
  label: string;
  placeholder: string;
  options: ComboboxOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the input text in sync when the selected id is cleared externally
  useEffect(() => {
    if (!selectedId) setQuery('');
  }, [selectedId]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function handleSelect(opt: ComboboxOption) {
    setQuery(opt.label);
    onSelect(opt.id);
    setOpen(false);
  }

  function handleClear() {
    setQuery('');
    onSelect('');
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-zinc-700">{label}:</label>
      <div ref={containerRef} className="relative">
        <div className="flex items-center border border-zinc-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-zinc-500">
          <input
            type="text"
            value={query}
            placeholder={placeholder}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="px-3 py-1.5 text-sm w-44 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 text-zinc-400 hover:text-zinc-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {open && filtered.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-zinc-200 rounded-md shadow-lg max-h-52 overflow-y-auto text-sm">
            {filtered.map((opt) => (
              <li
                key={opt.id}
                onMouseDown={() => handleSelect(opt)}
                className={`px-3 py-2 cursor-pointer hover:bg-zinc-100 ${selectedId === opt.id ? 'bg-zinc-50 font-medium' : ''}`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function StockTable({ stocks, branches, products, selectedBranch, selectedProduct, onBranchChange, onProductChange }: Props) {
  const branchOptions: ComboboxOption[] = branches.map((b) => ({ id: b._id, label: b.nombre }));
  const productOptions: ComboboxOption[] = products.map((p) => ({ id: p._id, label: `${p.nombre} (${p.sku})` }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Combobox
          label="Sucursal"
          placeholder="Todas las sucursales"
          options={branchOptions}
          selectedId={selectedBranch}
          onSelect={onBranchChange}
        />
        <Combobox
          label="Producto"
          placeholder="Todos los productos"
          options={productOptions}
          selectedId={selectedProduct}
          onSelect={onProductChange}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              {['SKU', 'Producto', 'Categoría', 'Sucursal', 'Cantidad'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-zinc-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {stocks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 text-sm">Sin resultados</td>
              </tr>
            ) : (
              stocks.map((s) => (
                <tr key={s._id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{s.producto.sku}</td>
                  <td className="px-4 py-3 font-medium">{s.producto.nombre}</td>
                  <td className="px-4 py-3 text-zinc-500">{s.producto.categoria}</td>
                  <td className="px-4 py-3 text-zinc-500">{s.sucursal.nombre}</td>
                  <td className="px-4 py-3 text-right font-semibold">{s.cantidad}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
