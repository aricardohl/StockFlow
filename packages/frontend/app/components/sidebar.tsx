'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/products', label: 'Productos' },
  { href: '/dashboard/branches', label: 'Sucursales' },
  { href: '/dashboard/movements', label: 'Movimientos' },
  { href: '/dashboard/reports', label: 'Reportes' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  return (
    <aside className="w-56 min-h-screen bg-zinc-900 text-zinc-100 flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-zinc-700">
        <span className="text-lg font-bold tracking-tight">StockFlow</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === l.href
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-700">
        <button
          onClick={logout}
          className="w-full px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors text-left"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
