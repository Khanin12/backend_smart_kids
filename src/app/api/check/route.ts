// app/api/check/route.ts
import { NextResponse } from "next/server";

function normalize(s: string) {
  return s
    .toLowerCase()
    .trim()
    // hapus karakter non-alphanumeric (spasi, tanda baca)
    .replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string) {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const matrix = Array.from({ length: la + 1 }, (_, i) =>
    Array(lb + 1).fill(0)
  );

  for (let i = 0; i <= la; i++) matrix[i][0] = i;
  for (let j = 0; j <= lb; j++) matrix[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[la][lb];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawSpoken = body.spoken ?? "";
    const rawAnswer = body.answer ?? "";

    const spokenNorm = normalize(String(rawSpoken));
    const answerNorm = normalize(String(rawAnswer));

    if (!spokenNorm || !answerNorm) {
      return NextResponse.json(
        { error: "spoken or answer missing", spoken: rawSpoken, answer: rawAnswer },
        { status: 400 }
      );
    }

    // common mis-hearings for short words (extend as needed)
    const common = ["iam", "iya", "aya", "ayem", "ayamm", "ayammm", "iam"];

    const distance = levenshtein(spokenNorm, answerNorm);
    const contains = spokenNorm.includes(answerNorm) || answerNorm.includes(spokenNorm);
    const similar = common.some((c) => spokenNorm.includes(c));

    // rules to accept as correct:
    // - exact match OR
    // - one contains the other OR
    // - levenshtein distance <= 2 (allow small typos/mishear)
    // - matches a known "common mis-hearing" pattern
    const isCorrect = 
      spokenNorm === answerNorm ||
      contains ||
      similar ||
      distance <= 2;

    const message = isCorrect ? "Jawaban kamu benar!" : "Jawaban kamu salah, coba lagi ya.";

    // return debug info so you can see what's going on in frontend devtools
    return NextResponse.json({
      spoken: rawSpoken,
      answer: rawAnswer,
      spokenNorm,
      answerNorm,
      distance,
      contains,
      similar,
      correct: isCorrect,
      message,
    });
  } catch (err: any) {
    console.error("API ERROR /api/check:", err);
    return NextResponse.json(
      { error: "Server error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
