import React, { useState, useRef } from 'react';

interface MicButtonProps {
  onTranscriptionComplete: (text: string) => void;
}

export function MicButton({ onTranscriptionComplete }: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          setIsProcessing(true);
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            try {
              const base64data = (reader.result as string).split(',')[1];
              // @ts-ignore
              const transcription = await window.api.transcribeAudio(base64data);
              onTranscriptionComplete(transcription);
            } catch (err: any) {
              alert('Transcription failed: ' + err.message);
            } finally {
              setIsProcessing(false);
              stream.getTracks().forEach((track) => track.stop());
            }
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err: any) {
        alert('Microphone access denied or error occurred: ' + err.message);
      }
    }
  };

  return (
    <button
      onClick={toggleRecording}
      disabled={isProcessing}
      className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 mr-4 z-10 ${
        isRecording 
          ? 'bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
          : isProcessing
          ? 'bg-blue-500/20'
          : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      {/* Pulse ring when recording */}
      {isRecording && (
        <span className="absolute inset-0 rounded-full border border-[#DF71FF] animate-ping opacity-75"></span>
      )}
      
      {/* Icon */}
      {isProcessing ? (
        <svg className="w-5 h-5 text-[#DF71FF] animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg 
          className={`w-6 h-6 transition-colors ${isRecording ? 'text-[#DF71FF]' : 'text-white'}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )}
    </button>
  );
}