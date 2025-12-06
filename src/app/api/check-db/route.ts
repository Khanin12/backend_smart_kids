import { getPool } from "@/app/lib/db";

export async function GET() {
  try {
    const pool = getPool();

    // 🔥 Paksa pool membuat koneksi baru, bukan reuse koneksi lama
    const connection = await pool.getConnection();

    // 🔥 Ping database — ini akan ERROR jika MySQL mati
    await connection.ping();

    // 🔥 Test query (opsional)
    await connection.query("SELECT 1");

    connection.release();

    return Response.json({
      status: "connected",
      message: "Database MySQL terhubung!",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        status: "error",
        message: "Database TIDAK terhubung!",
        error: message,
      },
      { status: 500 }
    );
  }
}
