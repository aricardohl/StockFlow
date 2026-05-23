'use client';

import { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Stock, Branch, Product } from '../types';
import { getStock } from '../services/stockService';
import { getBranches } from '../services/branchService';
import { getProducts } from '../services/productService';
import StockTable from '../components/stock-table';

export default function DashboardPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStock = useCallback(async () => {
    try {
      const params: { branch?: string; product?: string } = {};
      if (selectedBranch) params.branch = selectedBranch;
      if (selectedProduct) params.product = selectedProduct;
      const data = await getStock(Object.keys(params).length ? params : undefined);
      setStocks(data);
    } catch {
      toast.error('Error al cargar stock');
    }
  }, [selectedBranch, selectedProduct]);

  useEffect(() => {
    Promise.all([getBranches(), getProducts()])
      .then(([b, p]) => { setBranches(b); setProducts(p); })
      .catch(() => toast.error('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  if (loading) return <p className="text-zinc-400 text-sm">Cargando...</p>;

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Stock Global</h1>

        <StockTable
          stocks={stocks}
          branches={branches}
          products={products}
          selectedBranch={selectedBranch}
          selectedProduct={selectedProduct}
          onBranchChange={setSelectedBranch}
          onProductChange={setSelectedProduct}
        />
      </div>


    </>
  );
}
