"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  duration?: number | null;
  isOwn: boolean;
  isVoice?: boolean;
}

// Generate waveform with natural variation
const generateWaveform = (count: number = 32): number[] => {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const baseHeight = Math.random() * 0.7 + 0.25;
    const variation = Math.sin(i * 0.4) * 0.15;
    bars.push(Math.min(0.95, Math.max(0.2, baseHeight + variation)));
  }
  return bars;
};

export function AudioPlayer({ src, duration, isOwn, isVoice = true }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [waveform] = useState(() => generateWaveform(32));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Format time as M:SS
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  // Build full URL for audio
  const audioUrl = src?.startsWith("/") ? `${API_BASE}${src}` : src;

  const togglePlay = async () => {
    if (!audioRef.current) {
      // Create audio element on first play
      setIsLoading(true);
      setError(false);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.addEventListener("loadedmetadata", () => {
        setAudioDuration(audio.duration);
        setIsLoading(false);
      });
      
      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });
      
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      
      audio.addEventListener("error", (e) => {
        console.error("Audio error:", e);
        setError(true);
        setIsLoading(false);
      });
      
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("Play error:", e);
        setError(true);
        setIsLoading(false);
      }
    } else {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.error("Play error:", e);
          setError(true);
        }
      }
    }
  };

  // Seek functionality
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * audioDuration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  // Update duration when prop changes
  useEffect(() => {
    if (duration && duration > 0) {
      setAudioDuration(duration);
    }
  }, [duration]);

  return (
    <div className={cn(
      "flex items-center gap-2.5 min-w-[220px] max-w-[300px]",
      isOwn ? "flex-row" : "flex-row"
    )}>
      {/* Play/Pause Button - WhatsApp style */}
      <button
        onClick={togglePlay}
        disabled={isLoading || error}
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200",
          isOwn 
            ? "bg-white/25 hover:bg-white/35 active:bg-white/40 text-white" 
            : "bg-primary/15 hover:bg-primary/25 active:bg-primary/30 text-primary",
          (isLoading || error) && "opacity-50 cursor-not-allowed",
          !isLoading && !error && "hover:scale-105 active:scale-95"
        )}
      >
        {isLoading ? (
          <div className={cn(
            "w-5 h-5 border-2 rounded-full animate-spin",
            isOwn ? "border-white/40 border-t-white" : "border-primary/40 border-t-primary"
          )} />
        ) : error ? (
          <span className="text-lg">⚠️</span>
        ) : isPlaying ? (
          <Pause className="w-5 h-5" fill="currentColor" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Waveform and Progress */}
      <div className="flex-1 flex flex-col gap-1.5">
        {/* Waveform Bars */}
        <div 
          className="flex items-center gap-[2.5px] h-7 cursor-pointer group"
          onClick={handleSeek}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {waveform.map((height, index) => {
            const barProgress = (index / waveform.length) * 100;
            const isActive = barProgress <= progress;
            
            return (
              <div
                key={index}
                className={cn(
                  "w-[3px] rounded-full transition-all duration-100",
                  isOwn
                    ? isActive 
                      ? "bg-white group-hover:bg-white/90" 
                      : "bg-white/40 group-hover:bg-white/50"
                    : isActive 
                      ? "bg-primary group-hover:bg-primary/90" 
                      : "bg-primary/25 group-hover:bg-primary/35",
                  isPlaying && isActive && "animate-pulse"
                )}
                style={{ 
                  height: `${height * 100}%`,
                  minHeight: "6px"
                }}
              />
            );
          })}
        </div>

        {/* Time Display */}
        <div className={cn(
          "flex justify-between text-[10px] font-medium",
          isOwn ? "text-white/80" : "text-muted"
        )}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>
    </div>
  );
}
