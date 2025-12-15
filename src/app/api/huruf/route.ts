// app/api/huruf/route.ts
import { NextRequest } from 'next/server';
import { getPool } from "@/app/lib/db";

export async function GET() {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.ping();

    const [rows] = await connection.execute(
      'SELECT id, huruf, url_gambar FROM huruf ORDER BY huruf'
    );

    connection.release();

    // ✅ Konversi id ke number
    const data = (rows as any[]).map(row => ({
      ...row,
      id: Number(row.id), // pastikan id jadi number
    }));

    return Response.json({ data });
  } catch (error) {
    console.error('Error mengambil huruf:', error);
    return Response.json(
      { error: 'Gagal mengambil data huruf' },
      { status: 500 }
    );
  }
}