import { getPool } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

interface User extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
}

<<<<<<< HEAD
 export async function POST(request: Request) {
=======
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export async function POST(request: Request) {
>>>>>>> 4398ff8d9b1b60b959bd5a5cadc4f5639198e388
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi!" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const [rows] = await pool.query<User[]>(
      "SELECT id, name, email, password FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Email tidak ditemukan!" },
        { status: 404 }
      );
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return NextResponse.json(
        { error: "Password salah!" },
        { status: 401 }
      );
    }

    // Buat JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      message: "Login berhasil!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}