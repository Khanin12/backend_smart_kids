import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

// GET semua jawaban
export async function GET() {
  try {
    const db = getPool();
    const [rows] = await db.query(
      "SELECT * FROM jawaban ORDER BY id DESC"
    );

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST tambah jawaban
export async function POST(req) {
  try {
    const db = getPool();
    const body = await req.json();

    const { kata_id, jawaban_benar } = body;

    if (!kata_id || !jawaban_benar) {
      return NextResponse.json(
        { error: "kata_id dan jawaban_benar wajib diisi" },
        { status: 400 }
      );
    }

    await db.query(
      "INSERT INTO jawaban (kata_id, jawaban_benar) VALUES (?, ?)",
      [kata_id, jawaban_benar]
    );

    return NextResponse.json({
      message: "Jawaban berhasil ditambah",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
