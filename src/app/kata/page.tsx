"use client";

import { useEffect, useState } from "react";

// Interface untuk data kata
interface Kata {
  id: number;
  teks: string;
  kategori?: string | null;
  created_at?: string;
  hasil?: string | null;
  isRecording?: boolean;
}

// ... (Interfaces untuk Speech Recognition tetap sama) ...

// Extend Window interface untuk Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function KataPage() {
  const [listKata, setListKata] = useState<Kata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FUNGSI BARU: Untuk membersihkan string dari tanda baca dan spasi berlebih
  const normalizeString = (str: string): string => {
    // 1. Ubah ke huruf kecil
    // 2. Hapus semua tanda baca di awal/akhir/tengah
    // 3. Hapus spasi di awal dan akhir
    // 4. Hapus spasi ganda di tengah kata (jika ada)
    return str
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "") // Hapus tanda baca umum
      .trim()
      .replace(/\s+/g, ' '); // Ganti spasi ganda dengan spasi tunggal
  };

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/kata")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Gagal mengambil data: ${res.status}`);
        }
        return res.json();
      })
      .then((data: Kata[]) => {
        const kataDenganStatus = data.map((k) => ({
          ...k,
          hasil: null,
          isRecording: false,
        }));
        setListKata(kataDenganStatus);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  function mulaiRekam(id: number, kataBenar: string) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung Speech Recognition. Gunakan Chrome atau Edge.");
      return;
    }

    setListKata((currentList) =>
      currentList.map((k) =>
        k.id === id ? { ...k, isRecording: true, hasil: null } : k
      )
    );

    const rec = new SpeechRecognition();
    rec.lang = "id-ID";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      // Ambil hasil mentah dari rekaman
      const hasilSuaraRaw = event.results[0][0].transcript;
      
      // Bersihkan hasil rekaman untuk perbandingan
      const hasilSuaraClean = normalizeString(hasilSuaraRaw);
      
      // Bersihkan juga kata yang diharapkan (untuk berjaga-jaga)
      const kataBenarClean = normalizeString(kataBenar);
      
      // Lakukan perbandingan pada string yang sudah dibersihkan
      const cocok = hasilSuaraClean === kataBenarClean;
      
      setListKata((currentList) =>
        currentList.map((k) =>
          k.id === id
            ? { 
                ...k, 
                hasil: cocok 
                  ? "✔ BENAR" 
                  // Tampilkan hasil mentah ke user agar mereka tahu apa yang didengar mesin
                  : `❌ SALAH (Anda bilang: "${hasilSuaraRaw}", harapannya: "${kataBenar}")`, 
                isRecording: false 
              }
            : k
        )
      );
    };

    rec.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      let pesanError = "❌ Terjadi kesalahan.";
      if (event.error === 'no-speech') {
        pesanError = "❌ Tidak ada suara terdeteksi. Silakan coba lagi.";
      } else if (event.error === 'not-allowed') {
        pesanError = "❌ Akses mikrofon ditolak. Silakan izinkan mikrofon di browser Anda.";
      }
      
      setListKata((currentList) =>
        currentList.map((k) =>
          k.id === id ? { ...k, hasil: pesanError, isRecording: false } : k
        )
      );
    };

    rec.onend = () => {
      setListKata((currentList) =>
        currentList.map((k) =>
          k.id === id ? { ...k, isRecording: false } : k
        )
      );
    };

    rec.start();
  }

  // ... (Bagian rendering untuk loading, error, dan list kata tetap sama) ...
  if (isLoading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Belajar Kata</h1>
      <p style={{color: 'grey'}}>Klik tombol "Rekam" dan ucapkan kata yang ditampilkan dengan jelas.</p>

      {listKata.length === 0 ? (
        <p>Tidak ada kata yang tersedia.</p>
      ) : (
        listKata.map((k) => (
          <div
            key={k.id}
            style={{
              marginBottom: 20,
              padding: 15,
              border: "1px solid #ddd",
              borderRadius: 8,
              backgroundColor: k.isRecording ? "#f0f8ff" : "#f9f9f9",
              transition: "background-color 0.3s",
            }}
          >
            <strong style={{ fontSize: '1.2em' }}>{k.teks}</strong>
            {k.kategori && (
              <span style={{ marginLeft: 10, color: '#666', fontSize: '0.9em' }}>
                ({k.kategori})
              </span>
            )}
            <br />
            <button
              onClick={() => mulaiRekam(k.id, k.teks)}
              disabled={k.isRecording}
              style={{
                marginTop: 10,
                padding: "8px 16px",
                cursor: k.isRecording ? "not-allowed" : "pointer",
                backgroundColor: k.isRecording ? "#ccc" : "#0070f3",
                color: "white",
                border: "none",
                borderRadius: 5,
                transition: "background-color 0.3s",
              }}
            >
              {k.isRecording ? "🔴 Merekam..." : "🎤 Rekam"}
            </button>

            {k.hasil && (
              <p
                style={{
                  marginTop: 10,
                  fontWeight: "bold",
                  color: k.hasil.includes("BENAR") ? "green" : "red",
                }}
              >
                {k.hasil}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}