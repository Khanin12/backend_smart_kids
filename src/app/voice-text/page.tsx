"use client";

import { useState } from "react";

export default function Page() {
  const [status, setStatus] = useState("Klik mulai untuk menjawab");
  const [recording, setRecording] = useState(false);

  const answer = "ayam";

  // === Text To Speech ===
  const speak = (text: string) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "id-ID";
    msg.rate = 1; // lebih natural
    window.speechSynthesis.speak(msg);
  };

  // Normalisasi teks sebelum dikirim
  const normalize = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

  // === Rekam + Transkripsi ===
  const startRecording = () => {
    setRecording(true);
    setStatus("🎙 Mendengarkan...");

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("Browser kamu tidak mendukung speech recognition.");
      speak("Browser kamu tidak mendukung pengenalan suara.");
      setRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = async (event: any) => {
      let spoken = event.results[0][0].transcript || "";
      spoken = spoken.toLowerCase().trim();

      console.log("RAW SPOKEN:", spoken);

      // Kirim ke API
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spoken,
          answer,
        }),
      });

      const data = await res.json();
      console.log("API RESPONSE:", data);

      if (data.correct) {
        setStatus(`✅ Benar! Kamu menyebut: ${spoken}`);
        speak("Jawaban kamu benar!");
      } else {
        setStatus(`❌ Salah! Kamu menyebut: ${spoken}`);
        speak("Jawaban kamu salah, coba lagi ya.");
      }

      setRecording(false);
    };

    recognition.onerror = (e: any) => {
      console.warn("Speech error:", e.error);
      setStatus("Gagal mengenali suara. Ulangi lagi.");
      speak("Maaf, saya tidak menangkap suara kamu.");
      setRecording(false);
    };
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Smart Kids – Cek Suara</h1>

      <p style={{ marginTop: 20, fontSize: 20 }}>
        Jawaban benar: <b>{answer}</b>
      </p>

      <button
        onClick={() => speak("Ayam")}
        style={{
          padding: 12,
          background: "blue",
          color: "white",
          borderRadius: 10,
        }}
      >
        🔊 Putar Suara Ayam
      </button>

      <div style={{ marginTop: 30 }}>
        <button
          onClick={startRecording}
          disabled={recording}
          style={{
            padding: 12,
            background: recording ? "gray" : "green",
            color: "white",
            borderRadius: 10,
          }}
        >
          {recording ? "🎙 Mendengarkan..." : "🎙 Mulai Jawab"}
        </button>
      </div>

      <p style={{ marginTop: 30, fontSize: 22 }}>{status}</p>
    </div>
  );
}
