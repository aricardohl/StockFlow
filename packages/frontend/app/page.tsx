'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(localStorage.getItem('token') ? '/dashboard' : '/auth/login');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">
      Redirigiendo...
    </div>
  );
}
