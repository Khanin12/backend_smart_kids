// app/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

export default function LatihanMengucapkanHuruf() {
  const [hurufList, setHurufList] = useState<Array<{ id: number; huruf: string; url_gambar: string }>>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ pesan: string; benar?: boolean } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedAudioBlobRef = useRef<Blob | null>(null);

  // ✅ Ambil daftar huruf hanya sekali saat komponen dimuat
  useEffect(() => {
    const loadHuruf = async () => {
      try {
        const res = await fetch('/api/huruf');
        if (!res.ok) throw new Error('Gagal memuat data');
        const data = await res.json();

        // ✅ Pastikan id jadi number (karena mysql2 bisa kirim string)
        const hurufDenganIdNumber = (data.data || []).map((item: any) => ({
          ...item,
          id: Number(item.id),
        }));

        setHurufList(hurufDenganIdNumber);
      } catch (err) {
        console.error('Gagal memuat daftar huruf:', err);
        alert('Gagal memuat daftar huruf. Periksa koneksi atau backend.');
      }
    };

    loadHuruf();
  }, []); // ⚠️ deps kosong = jalan sekali

  const startRecording = async () => {
    if (selectedId === null) {
      alert('Silakan pilih huruf terlebih dahulu!');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        recordedAudioBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Hentikan stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setResult(null);
    } catch (err) {
      console.error('Error mengakses mikrofon:', err);
      alert('Gagal mengakses mikrofon. Izinkan akses audio di browser Anda.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKirim = async () => {
    const audioBlob = recordedAudioBlobRef.current;
    if (!audioBlob) {
      alert('Tidak ada rekaman suara!');
      return;
    }
    if (selectedId === null) {
      alert('Pilih huruf terlebih dahulu!');
      return;
    }

    const formData = new FormData();
    formData.append('id_huruf', selectedId.toString()); // aman karena selectedId number
    formData.append('id_pengguna', 'web_user_demo');
    formData.append('audio', audioBlob, 'rekaman.webm');

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/speech/recognize', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          pesan: data.pesan || 'Berhasil diproses!',
          benar: data.benar,
        });
      } else {
        setResult({
          pesan: data.error || 'Gagal memproses suara',
        });
      }
    } catch (error) {
      console.error('Error saat kirim:', error);
      setResult({ pesan: 'Koneksi gagal. Coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#2e7d32' }}>Latihan Mengucapkan Huruf</h1>
      <p style={{ textAlign: 'center', color: '#555' }}>
        Pilih huruf, lalu tekan tombol mikrofon dan ucapkan!
      </p>

      {/* Daftar Huruf */}
      <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem' }}>
        {hurufList.length > 0 ? (
          hurufList.map((huruf) => (
            <div
              key={huruf.id}
              onClick={() => setSelectedId(huruf.id)}
              style={{
                border: selectedId === huruf.id ? '3px solid #2e7d32' : '1px solid #ccc',
                borderRadius: '12px',
                padding: '1.2rem',
                cursor: 'pointer',
                backgroundColor: selectedId === huruf.id ? '#e8f5e9' : '#fff',
                textAlign: 'center',
                width: '100px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              <img
                src={huruf.url_gambar}
                alt={`Huruf ${huruf.huruf}`}
                style={{ width: '60px', height: '60px', objectFit: 'contain' }}
              />
              <div style={{ marginTop: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {huruf.huruf}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', width: '100%' }}>Memuat huruf...</p>
        )}
      </div>

      {/* Rekam & Kirim */}
      <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        {isRecording ? (
          <button
            onClick={stopRecording}
            style={{
              padding: '0.6rem 1.5rem',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            ⏹️ Hentikan Rekaman
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={selectedId === null || loading}
            style={{
              padding: '0.6rem 1.5rem',
              backgroundColor: selectedId === null ? '#bdbdbd' : '#2e7d32',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedId === null ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            🔴 Mulai Rekam
          </button>
        )}

        {audioUrl && !isRecording && (
          <div style={{ marginTop: '1.5rem' }}>
            <audio controls src={audioUrl} style={{ marginBottom: '1rem' }} />
            <br />
            <button
              onClick={handleKirim}
              disabled={loading}
              style={{
                padding: '0.6rem 1.5rem',
                backgroundColor: loading ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
              }}
            >
              {loading ? 'Mengirim...' : 'Kirim & Evaluasi'}
            </button>
          </div>
        )}
      </div>

      {/* Hasil Evaluasi */}
      {result && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: result.benar === false ? '#ffebee' : result.benar ? '#e8f5e9' : '#fff3e0',
            border: result.benar === false ? '1px solid #f44336' : result.benar ? '1px solid #4caf50' : '1px solid #ff9800',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <strong>{result.pesan}</strong>
          {result.benar === true && (
            <div style={{ color: '#2e7d32', marginTop: '0.3rem' }}>✅ Jawaban benar!</div>
          )}
          {result.benar === false && (
            <div style={{ color: '#d32f2f', marginTop: '0.3rem' }}>❌ Coba lagi!</div>
          )}
        </div>
      )}
    </div>
  );
}