import { getPool } from "@/app/lib/db";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = Number(params.id);

    if (isNaN(userId)) {
      return Response.json({ error: "ID tidak valid!" }, { status: 400 });
    }

    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(
      "SELECT id, name, email FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return Response.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const { password, ...user } = rows[0];
    return Response.json(user);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}