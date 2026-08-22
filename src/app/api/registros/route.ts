import { NextRequest, NextResponse } from 'next/server';
import { Registro } from '@/lib/types';

// Almacén persistente en memoria del servidor
// Para serverless en Vercel, mantiene el estado global compartido entre dispositivos
const globalRegistrosMap = new Map<string, Registro>();

// Semilla inicial
const DEMO_SEED: Registro = {
  id: 'demo-oro',
  folio: 'ENT-20260821-3012',
  tipoOperacion: 'ENTREGA',
  categoria: 'ORO',
  fechaHora: new Date(Date.now() - 3600000 * 2).toISOString(),
  ubicacion: {
    sede: 'Sede Principal',
    proyecto: 'Custodia Minera',
  },
  entregaPor: {
    nombre: 'Alejandro Morales',
    documento: 'CC 1098234710',
  },
  recibePor: {
    nombre: 'Javier Restrepo',
    documento: 'CC 71294801',
  },
  oro: {
    gramos: 48.50,
    valorLiquidacion: 16975000,
    precioPorGramo: 350000,
    moneda: 'COP',
    tipoPieza: 'Barra Fundida',
    observaciones: 'Sellada con precinto #ORO-881',
  },
  observacionesGenerales: 'Entrega de material aurífero pesado en balanza calibrada.',
  clausulaAceptada: true,
  sincronizadoDrive: true,
  estado: 'COMPLETADO',
  creadoEn: new Date(Date.now() - 3600000 * 2).toISOString(),
  actualizadoEn: new Date(Date.now() - 3600000 * 2).toISOString(),
};

if (globalRegistrosMap.size === 0) {
  globalRegistrosMap.set(DEMO_SEED.id, DEMO_SEED);
}

export async function GET() {
  const registros = Array.from(globalRegistrosMap.values()).sort(
    (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
  );

  return NextResponse.json(
    { registros, total: registros.length },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const registro: Registro = await request.json();

    if (!registro || !registro.id) {
      return NextResponse.json({ error: 'Datos de registro inválidos' }, { status: 400 });
    }

    // Si ya existe el registro (ej. estaba en PENDIENTE_FIRMA y ahora viene con firmas y COMPLETADO),
    // lo actualizamos conservando cualquier campo previo relevante
    const existing = globalRegistrosMap.get(registro.id);
    const updatedRegistro: Registro = {
      ...existing,
      ...registro,
      actualizadoEn: new Date().toISOString(),
    };

    globalRegistrosMap.set(registro.id, updatedRegistro);

    return NextResponse.json({
      success: true,
      registro: updatedRegistro,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error guardando registro en servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }

  const deleted = globalRegistrosMap.delete(id);
  return NextResponse.json({ success: deleted });
}
