import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const webhookUrl = payload.webhookUrl;

    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, message: 'URL de Webhook requerida' },
        { status: 400 }
      );
    }

    const driveResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const data = await driveResponse.json().catch(() => ({ status: 'OK' }));

    return NextResponse.json({
      success: true,
      message: 'Sincronizado exitosamente con Google Drive (Trabajo/Mono)',
      driveData: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Error de sincronización' },
      { status: 500 }
    );
  }
}
