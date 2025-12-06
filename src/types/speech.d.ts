// Tambahkan deklarasi global agar TS mengenali SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }

  class SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
}

export {};
