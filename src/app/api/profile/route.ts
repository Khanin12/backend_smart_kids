import { getPool } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/verifyToken";
import { RowDataPacket } from "mysql2";

interface User extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
}

export async function PUT(request: Request) {
  try {
    // === 1. Verifikasi otorisasi ===
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token tidak ditemukan!" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token tidak valid!" }, { status: 401 });
    }

    // === 2. Parse body request (dengan nama field bahasa Indonesia) ===
    const body = await request.json();
    const { name, passwordSekarang, passwordBaru } = body; // ✅ NAMA FIELD DALAM BAHASA INDONESIA

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nama wajib diisi!" }, { status: 400 });
    }

    const pool = getPool();
    const userId = payload.userId;

    // === 3. Ambil data user saat ini ===
    const [userRows] = await pool.query<User[]>(
      "SELECT id, name, email, password FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan!" }, { status: 404 });
    }

    const currentUser = userRows[0];
    let updateFields: string[] = [];
    let updateValues: any[] = [];

    // === 4. Cek apakah ingin ganti password ===
    if (passwordSekarang !== undefined || passwordBaru !== undefined) {
      // Jika salah satu diisi, pastikan keduanya diisi
      if (!passwordSekarang || !passwordBaru) {
        return NextResponse.json(
          { error: "Password lama dan password baru wajib diisi bersamaan!" },
          { status: 400 }
        );
      }

      if (passwordBaru.length < 6) {
        return NextResponse.json(
          { error: "Password baru minimal 6 karakter!" },
          { status: 400 }
        );
      }

      // Verifikasi password lama
      const isMatch = await bcrypt.compare(passwordSekarang, currentUser.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Password lama salah!" }, { status: 401 });
      }

      // Hash password baru
      const hashedNewPassword = await bcrypt.hash(passwordBaru, 10);
      updateFields.push("password = ?");
      updateValues.push(hashedNewPassword);
    }

    // Selalu update nama
    updateFields.push("name = ?");
    updateValues.push(name.trim());

    // === 5. Update database ===
    updateValues.push(userId);

    await pool.query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    // === 6. Ambil data terbaru (tanpa password) ===
    const [updatedRows] = await pool.query<User[]>(
      "SELECT id, name, email FROM users WHERE id = ?",
      [userId]
    );

    return NextResponse.json({
      message: "Profil berhasil diperbarui!",
      user: updatedRows[0],
    });
  } catch (error: unknown) {
    console.error("Edit profile error:", error);
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}