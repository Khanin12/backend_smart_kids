// app/api/speech/recognize/route.ts
import { NextRequest } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getPool } from '@/app/lib/db';
import { mkdir } from 'fs/promises';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // opsional: untuk Vercel

export async function POST(request: NextRequest) {
  try {
    // Ambil FormData
    const formData = await request.formData();
    const id_huruf = formData.get('id_huruf');
    const id_pengguna = formData.get('id_pengguna')?.toString() || 'anonymous';
    const audioFile = formData.get('audio') as File | null;

    if (!id_huruf || isNaN(Number(id_huruf))) {
      return Response.json({ error: 'id_huruf wajib dan harus angka' }, { status: 400 });
    }
    if (!audioFile) {
      return Response.json({ error: 'File audio wajib diunggah' }, { status: 400 });
    }

    // Simpan file audio
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${audioFile.name.replace(/\s+/g, '_')}`;
    const uploadDir = join(process.cwd(), 'public', 'rekaman');

    // Buat folder jika belum ada
    await mkdir(uploadDir, { recursive: true });

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    const url_audio = `/rekaman/${filename}`;

    // Ambil huruf target dari DB
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.ping();

    const [hurufRows] = await connection.execute(
      'SELECT huruf FROM huruf WHERE id = ?',
      [Number(id_huruf)]
    );

    connection.release();

    const targetHuruf = (hurufRows as any[])[0]?.huruf?.toLowerCase();
    if (!targetHuruf) {
      return Response.json({ error: 'Huruf tidak ditemukan' }, { status: 404 });
    }

    // 🔁 SIMULASI: anggap suara benar (di produksi, ganti dengan STT sungguhan)
    const teks_hasil = targetHuruf;
    const benar = true;
    const kepercayaan = 0.95;

    // Simpan ke tabel percobaan_pengucapan
    const insertConnection = await pool.getConnection();
    await insertConnection.execute(
      `INSERT INTO percobaan_pengucapan 
       (id_pengguna, id_huruf, url_audio, teks_hasil, benar, kepercayaan) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_pengguna, Number(id_huruf), url_audio, teks_hasil, benar, kepercayaan]
    );
    insertConnection.release();

    return Response.json({
      pesan: 'Pengucapan berhasil diproses!',
      benar,
      teks_hasil,
      url_audio,
    });

  } catch (error) {
    console.error('Error di /api/speech/recognize:', error);
    return Response.json(
      { error: 'Gagal memproses pengucapan' },
      { status: 500 }
    );
  }
}