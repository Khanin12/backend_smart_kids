import { getPool } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

// tipe hasil query yang valid
interface UserExists extends RowDataPacket {
  id: number;
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return Response.json(
        { error: "Semua field wajib diisi!" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const pool = getPool();

    // Query tanpa ANY, tipe valid untuk mysql2
    const [existing] = await pool.query<UserExists[]>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return Response.json(
        { error: "Email sudah digunakan!" },
        { status: 409 }
      );
    }

    await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    return Response.json({
      status: "success",
      message: "Registrasi berhasil!",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
