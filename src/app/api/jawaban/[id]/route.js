import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET(req, context) {
  try {
    const { id } = await context.params;  // ⬅ WAJIB await

    const db = getPool();
    const [rows] = await db.query(
      "SELECT * FROM jawaban WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Jawaban tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
