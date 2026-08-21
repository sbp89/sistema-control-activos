'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, 
  History, 
  Settings, 
  PlusCircle, 
  Cloud, 
  CloudOff, 
  ShieldCheck, 
  Layers,
  Menu,
  X
} from 'lucide-react';
import { getGoogleDriveConfig } from '@/lib/db';
import { GoogleDriveConfig } from '@/lib/types';

export default function Navbar() {
  const pathname = usePathname();
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setDriveConfig(getGoogleDriveConfig());
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Nuevo Registro', icon: PlusCircle },
    { href: '/historial', label: 'Historial & Actas', icon: History },
    { href: '/configuracion', label: 'Ajustes / Drive', icon: Settings },
  ];

  const isConfigured = Boolean(driveConfig?.webhookUrl);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block text-white">
                Control de Activos
              </span>
              <span className="text-xs text-emerald-400 font-medium block">
                Entrega & Recepción • Drive: Trabajo/Mono
              </span>
            </div>
          </Link>

          {/* Enlaces de Navegación Escritorio */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Estado de Sincronización Drive */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link
              href="/configuracion"
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isConfigured
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80'
                  : 'bg-amber-950/70 border-amber-500/40 text-amber-300 hover:bg-amber-900/80'
              }`}
              title={
                isConfigured
                  ? 'Google Drive conectado a Trabajo/Mono'
                  : 'Google Drive no configurado. Haz clic para configurar.'
              }
            >
              {isConfigured ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Drive: Trabajo/Mono (Activo)</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Drive: Sin Vincular</span>
                </>
              )}
            </Link>
          </div>

          {/* Botón Menú Móvil */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800">
            <Link
              href="/configuracion"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 rounded-lg"
            >
              <span>Estado Google Drive</span>
              <span className={isConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                {isConfigured ? 'Conectado (Trabajo/Mono)' : 'Configuración pendiente'}
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
