'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { checkIsAuthenticated } from '@/lib/auth';
import { RefreshCw } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Rutas públicas que NO requieren autenticación (clave para WhatsApp y Login)
  const isPublicRoute = pathname.startsWith('/firmar') || pathname === '/login';

  useEffect(() => {
    const isAuth = checkIsAuthenticated();

    if (!isPublicRoute && !isAuth) {
      router.replace('/login');
    } else if (pathname === '/login' && isAuth) {
      router.replace('/');
    } else {
      setIsChecking(false);
    }
  }, [pathname, isPublicRoute, router]);

  // Si es ruta pública (como /firmar), mostrar inmediatamente sin demoras
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Si está verificando credenciales en rutas protegidas
  if (isChecking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return <>{children}</>;
}
