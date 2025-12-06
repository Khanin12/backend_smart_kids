"use client";

import { useEffect, useState } from "react";

type KataType = {
  id: number;
  kata: string;
};

export default function KataPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<KataType | null>(null);
  const [result, setResult] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // Ambil kata dari API
  useEffect(() => {
    fetch(`/api/kata/${params.id}`)
      .then((res) => res.json())
      .then((res) => setData(res));
  }, [params.id]);

  // Fungsi rekam
  const startRecognition = () => {
    const Speech =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Speech) {
      alert("Browser tidak mendukung Speech Recognition!");
      return;
    }

    const recognition = new Speech();
    recognition.lang = "id-ID";
    recognition.interimResults = false;

    recognition.start();
    setIsRecording(true);

    recognition.onresult = (event: any) => {
      const spoken = event.results[0][0].transcript.toLowerCase();
      setResult(spoken);
      setIsRecording(false);

      // Cocokkan dengan data
      if (data && spoken === data.kata.toLowerCase()) {
        playAudio("/audio/benar.mp3");
      } else {
        playAudio("/audio/salah.mp3");
      }
    };

    recognition.onerror = () => setIsRecording(false);
  };

  // Fungsi play audio
  const playAudio = (src: string) => {
    const audio = new Audio(src);
    audio.play();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Kata:</h1>

      {!data ? (
        <p>Loading...</p>
      ) : (
        <h2 style={{ fontSize: 40 }}>{data.kata}</h2>
      )}

      <button
        onClick={startRecognition}
        disabled={isRecording}
        style={{ marginTop: 20, padding: 10 }}
      >
        {isRecording ? "Mendengarkan..." : "Mulai Rekam"}
      </button>

      {result && (
        <p style={{ marginTop: 20 }}>
          Kamu mengucapkan: <strong>{result}</strong>
        </p>
      )}
    </div>
  );
}
