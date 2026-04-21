import { NextResponse } from 'next/server';
import { pool } from '@/db/client';

export async function GET() {
  const started = Date.now();
  try {
    await pool.query('select 1');
    const ms = Date.now() - started;
    return NextResponse.json({ status: 'ok', db: 'up', responseTimeMs: ms }, { status: 200 });
  } catch (e) {
    const ms = Date.now() - started;
    return NextResponse.json({ status: 'degraded', db: 'down', responseTimeMs: ms }, { status: 503 });
  }
}
