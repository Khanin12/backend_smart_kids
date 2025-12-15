// app/api/alphabet/route.ts
import { getPool } from "@/app/lib/db";

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT letter, audio_path FROM alphabet ORDER BY letter"
    );


    // Menggunakan ip wifi lokal terminal
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://192.168.100.89:3000";
    const alphabets = rows.map((row: any) => ({
      letter: row.letter,
      audio_url: baseUrl + row.audio_path,
    }));

    return Response.json({ alphabets });
  } catch (error) {
    console.error("Error fetching alphabet list:", error);
    return Response.json(
      { error: "Gagal mengambil daftar huruf" },
      { status: 500 }
    );
  }
}