import React, { useState, useRef } from 'react';

export function BrowseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="browse-button" onClick={onClick}>
      <div className="browse-container">
        <div className="folder folder_one"></div>
        <div className="folder folder_two"></div>
        <div className="folder folder_three"></div>
        <div className="folder folder_four"></div>
      </div>
      <div className="active_line"></div>
      <span className="browse-text">File Explorer</span>
    </button>
  );
}

export function StartButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="start-button" onClick={onClick}>
      <span className="start-fold"></span>
      <div className="points_wrapper">
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
      </div>
      <span className="start-inner">
        <svg
          className="start-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        >
          <polyline points="13.18 1.37 13.18 9.64 21.45 9.64 10.82 22.63 10.82 14.36 2.55 14.36 13.18 1.37"></polyline>
        </svg>
        Start
      </span>
    </button>
  );
}

export function MicButton({ onTranscriptionComplete }: { onTranscriptionComplete: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          setIsProcessing(true);
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          // In a real app we'd send this to Whisper or similar.
          // For now just simulate transcription
          setTimeout(() => {
            onTranscriptionComplete("Simulated transcription text");
            setIsProcessing(false);
          }, 1000);
        };
        
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing mic:", err);
      }
    }
  };

  return (
    <button
      onClick={toggleRecording}
      className={`p-4 transition-colors rounded-xl border flex items-center justify-center cursor-pointer shadow-lg relative ${
        isRecording 
          ? 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30' 
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
      title="Voice Input"
    >
      <div className={`w-6 h-6 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/70'}`} />
    </button>
  );
}