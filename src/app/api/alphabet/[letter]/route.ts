// app/api/alphabet/[letter]/route.ts
import { getPool } from "@/app/lib/db";

// ⚠️ NEXT.JS 15+: params adalah Promise!
export async function GET(
  request: Request,
  { params }: { params: Promise<{ letter: string }> }
) {
  try {
    // ✅ WAJIB await params
    const { letter: rawLetter } = await params;

    // Validasi input
    if (typeof rawLetter !== "string") {
      return Response.json({ error: "Input tidak valid" }, { status: 400 });
    }

    const letter = rawLetter.trim().toUpperCase();

    // Validasi huruf A-Z
    if (!/^[A-Z]$/.test(letter)) {
      return Response.json({ error: "Huruf harus antara A-Z" }, { status: 400 });
    }

    // Query database
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT audio_path FROM alphabet WHERE letter = ?",
      [letter]
    );

    if (rows.length === 0) {
      return Response.json({ error: "Huruf tidak ditemukan" }, { status: 404 });
    }

    const { audio_path } = rows[0] as { audio_path: string };

    // Menggunakan ip wifi lokal terminal

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://192.168.100.89:3000";
    
    const audio_url = baseUrl + audio_path; // audio_path = "/sounds/a.mp3"

    return Response.json({ letter, audio_url });
  } catch (error) {
    console.error("Error fetching single letter:", error);
    return Response.json(
      { error: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}