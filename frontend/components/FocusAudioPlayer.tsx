"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FOCUS_CLASSICAL_TRACKS, type ClassicalFocusTrack } from "@/lib/media";
import { Icon } from "@/components/illustrations";

interface FocusAudioPlayerProps {
  active: boolean;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function FocusAudioPlayer({ active, className }: FocusAudioPlayerProps) {
  // Shuffle pick on initial mount or activation
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * FOCUS_CLASSICAL_TRACKS.length));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack: ClassicalFocusTrack = FOCUS_CLASSICAL_TRACKS[trackIndex] ?? FOCUS_CLASSICAL_TRACKS[0];

  // Helper to pick next track (with shuffle or sequence)
  const getNextIndex = useCallback((currentIdx: number, isShuffle: boolean): number => {
    const total = FOCUS_CLASSICAL_TRACKS.length;
    if (total <= 1) return 0;
    if (!isShuffle) {
      return (currentIdx + 1) % total;
    }
    // Random pick avoiding current
    let next: number;
    do {
      next = Math.floor(Math.random() * total);
    } while (next === currentIdx);
    return next;
  }, []);

  const getPrevIndex = useCallback((currentIdx: number): number => {
    const total = FOCUS_CLASSICAL_TRACKS.length;
    return (currentIdx - 1 + total) % total;
  }, []);

  // When active changes or track changes, load and play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (active) {
      audio.volume = isMuted ? 0 : volume;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch(() => {
            setIsPlaying(false);
            setAutoplayBlocked(true);
          });
      }
    } else {
      audio.pause();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [active, trackIndex, isMuted, volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.volume = isMuted ? 0 : volume;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => undefined);
    }
  };

  const nextTrack = () => {
    setTrackIndex((prev) => getNextIndex(prev, shuffle));
    setCurrentTime(0);
  };

  const prevTrack = () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    setTrackIndex((prev) => getPrevIndex(prev));
    setCurrentTime(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    nextTrack();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.volume = next ? 0 : volume;
      }
      return next;
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  return (
    <div className={`focus-classical-player${className ? ` ${className}` : ""}`} role="region" aria-label="Classical focus music player">
      {/* Underlying HTML5 audio element */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => {
          if (audioRef.current && currentTrack.fallbackSrc && audioRef.current.src !== currentTrack.fallbackSrc) {
            audioRef.current.src = currentTrack.fallbackSrc;
            if (active) void audioRef.current.play().catch(() => undefined);
          }
        }}
      />

      {/* Autoplay blocked banner */}
      {autoplayBlocked && (
        <div className="fcp-notice" onClick={togglePlay} role="button" tabIndex={0}>
          <Icon id="i-spark" style={{ width: 14, height: 14 }} />
          <span>Click to start playing focus music</span>
        </div>
      )}

      {/* Main Player Bar */}
      <div className="fcp-bar">
        {/* Track Details & Visualizer */}
        <div className="fcp-track-info">
          <div className="fcp-eq" aria-hidden="true">
            <span className={`fcp-bar-line${isPlaying ? " is-active" : ""}`} />
            <span className={`fcp-bar-line${isPlaying ? " is-active" : ""}`} />
            <span className={`fcp-bar-line${isPlaying ? " is-active" : ""}`} />
            <span className={`fcp-bar-line${isPlaying ? " is-active" : ""}`} />
          </div>
          <div className="fcp-meta">
            <strong className="fcp-title" title={currentTrack.name}>
              {currentTrack.name}
            </strong>
            <span className="fcp-movement">{currentTrack.movement}</span>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="fcp-controls">
          <button
            type="button"
            className="fcp-btn fcp-btn--subtle"
            onClick={prevTrack}
            title="Previous track"
            aria-label="Previous track"
          >
            <span style={{ fontSize: 13, transform: "scaleX(-1)", display: "inline-block" }}>▶▶</span>
          </button>

          <button
            type="button"
            className="fcp-btn fcp-btn--play"
            onClick={togglePlay}
            title={isPlaying ? "Pause music" : "Play music"}
            aria-label={isPlaying ? "Pause music" : "Play music"}
          >
            <Icon id={isPlaying ? "i-pause" : "i-play"} style={{ width: 15, height: 15 }} />
          </button>

          <button
            type="button"
            className="fcp-btn fcp-btn--subtle"
            onClick={nextTrack}
            title="Next track"
            aria-label="Next track"
          >
            <span style={{ fontSize: 13 }}>▶▶</span>
          </button>
        </div>

        {/* Scrub / Time Strip */}
        <div className="fcp-scrub-strip">
          <span className="fcp-time">{formatTime(currentTime)}</span>
          <div className="fcp-slider-wrap">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="fcp-slider"
              aria-label="Seek track position"
            />
            <div
              className="fcp-slider-fill"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <span className="fcp-time">{formatTime(duration)}</span>
        </div>

        {/* Auxiliary Controls (Shuffle, Volume, Playlist toggle) */}
        <div className="fcp-aux">
          <button
            type="button"
            className={`fcp-chip${shuffle ? " is-on" : ""}`}
            onClick={() => setShuffle((s) => !s)}
            title={shuffle ? "Shuffle: ON" : "Shuffle: OFF"}
            aria-label={shuffle ? "Shuffle: ON" : "Shuffle: OFF"}
          >
            <span>⇄</span> Shuffle
          </button>

          <div className="fcp-vol-wrap">
            <button
              type="button"
              className="fcp-btn fcp-btn--subtle"
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              <Icon id={isMuted ? "i-volx" : "i-vol"} style={{ width: 15, height: 15 }} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="fcp-vol-slider"
              aria-label="Volume slider"
            />
          </div>

          <button
            type="button"
            className={`fcp-btn fcp-btn--subtle${showPlaylist ? " is-active" : ""}`}
            onClick={() => setShowPlaylist((p) => !p)}
            title="View classical playlist"
            aria-label="View classical playlist"
          >
            <span style={{ fontSize: 13 }}>☰</span>
          </button>
        </div>
      </div>

      {/* Expandable Playlist Selector */}
      {showPlaylist && (
        <div className="fcp-playlist-drawer">
          <div className="fcp-playlist-head">
            <span className="meta">Classical Focus Playlist ({FOCUS_CLASSICAL_TRACKS.length} Pieces)</span>
            <button
              type="button"
              className="fcp-btn fcp-btn--subtle"
              onClick={() => setShowPlaylist(false)}
              style={{ width: 24, height: 24 }}
            >
              ✕
            </button>
          </div>
          <ul className="fcp-playlist-list">
            {FOCUS_CLASSICAL_TRACKS.map((t, idx) => {
              const isCurrent = idx === trackIndex;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`fcp-track-row${isCurrent ? " is-active" : ""}`}
                    onClick={() => {
                      setTrackIndex(idx);
                      setCurrentTime(0);
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="fcp-track-idx">{isCurrent && isPlaying ? "▶" : idx + 1}</span>
                      <div>
                        <strong className="fcp-track-row-name">{t.name}</strong>
                        <span className="fcp-track-row-sub">{t.movement}</span>
                      </div>
                    </div>
                    <span className="fcp-track-badge">{t.instrument}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
