import { NextRequest, NextResponse } from 'next/server';
import { BorradorRemoto, Registro } from '@/lib/types';

// Almacén persistente en memoria del servidor
// Para serverless en Vercel, combinamos almacenamiento en memoria y sincronización de estado
const globalDrafts = new Map<string, BorradorRemoto>();
const globalCompletedDrafts = new Set<string>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || searchParams.get('folio');

  if (!id) {
    return NextResponse.json({ error: 'Falta el identificador de borrador' }, { status: 400 });
  }

  // Buscar por ID o por Folio
  let draft = globalDrafts.get(id);
  if (!draft) {
    const list = Array.from(globalDrafts.values());
    for (let i = 0; i < list.length; i++) {
      const d = list[i];
      if (d.folio === id || d.id === id) {
        draft = d;
        break;
      }
    }
  }

  const isCompleted = globalCompletedDrafts.has(id) || (draft && draft.completado);

  if (isCompleted) {
    return NextResponse.json({ 
      error: 'El acta ya fue firmada y completada.',
      completed: true 
    }, { status: 200 });
  }

  if (!draft) {
    return NextResponse.json({ error: 'Borrador no encontrado', notFound: true }, { status: 404 });
  }

  return NextResponse.json({ draft, completed: false });
}

export async function POST(request: NextRequest) {
  try {
    const body: BorradorRemoto = await request.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Datos de borrador inválidos' }, { status: 400 });
    }

    globalDrafts.set(body.id, body);
    if (body.folio) {
      globalDrafts.set(body.folio, body);
    }

    return NextResponse.json({ success: true, id: body.id, folio: body.folio });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error guardando borrador' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, folio } = await request.json();
    const key = id || folio;
    if (!key) {
      return NextResponse.json({ error: 'Falta ID para completar' }, { status: 400 });
    }

    globalCompletedDrafts.add(key);
    if (id) globalCompletedDrafts.add(id);
    if (folio) globalCompletedDrafts.add(folio);

    const draft = globalDrafts.get(key) || (id ? globalDrafts.get(id) : undefined);
    if (draft) {
      draft.completado = true;
    }

    return NextResponse.json({ success: true, completed: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error completando borrador' }, { status: 500 });
  }
}
