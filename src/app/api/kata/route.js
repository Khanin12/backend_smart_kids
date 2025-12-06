import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

// GET semua kata
export async function GET() {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM kata");
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST tambah kata
export async function POST(req) {
  try {
    const db = getPool();
    const body = await req.json();

    const { kata } = body;
    if (!kata) return NextResponse.json({ error: "kata wajib diisi" }, { status: 400 });

    await db.query("INSERT INTO kata (teks) VALUES (?)", [kata]);

    return NextResponse.json({ message: "kata ditambah" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
