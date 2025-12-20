import { getPool } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2/promise";

interface User extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
}

 export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email dan password wajib diisi!" },
        { status: 400 }
      );
    }

    const pool = getPool();

    const [rows] = await pool.query<User[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return Response.json(
        { error: "Email tidak ditemukan!" },
        { status: 404 }
      );
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return Response.json(
        { error: "Password salah!" },
        { status: 401 }
      );
    }

    return Response.json({
      status: "success",
      message: "Login berhasil!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
