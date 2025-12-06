import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const conn = await db();
  const [rows] = await conn.execute(`
      SELECT k.id, k.teks, k.kategori, j.jawaban_benar
      FROM kata k
      JOIN jawaban j ON j.kata_id = k.id
  `);

  return NextResponse.json(rows);
}
