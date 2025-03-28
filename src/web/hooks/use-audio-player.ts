import { useState, useEffect, useCallback } from "react";

interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

export const useAudioPlayer = (url: string) => {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    error: null,
    retryCount: 0,
  });
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handleError = useCallback(
    (retryCount: number) => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: "Connection lost",
        retryCount,
      }));

      const timer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          error: null,
          isLoading: true,
        }));
        const newAudio = new Audio(url);
        newAudio.play().catch(() => handleError(retryCount + 1));
        setAudio(newAudio);
      }, 2000);

      return () => clearTimeout(timer);
    },
    [url],
  );

  const togglePlay = useCallback(() => {
    if (!audio) {
      const newAudio = new Audio(url);
      newAudio.onerror = () => handleError(1);
      newAudio.play().catch(() => handleError(1));
      setAudio(newAudio);
      setState((prev) => ({
        ...prev,
        isPlaying: true,
        isLoading: true,
      }));
      return;
    }

    if (state.isPlaying) {
      audio.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    } else {
      audio.play().catch(() => handleError(state.retryCount + 1));
      setState((prev) => ({ ...prev, isPlaying: true }));
    }
  }, [audio, state.isPlaying, state.retryCount, url, handleError]);

  useEffect(() => {
    if (!audio) return;

    const handleLoadStart = () => {
      setState((prev) => ({ ...prev, isLoading: true }));
    };

    const handleCanPlay = () => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
    };

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [audio]);

  useEffect(() => {
    return () => {
      audio?.pause();
    };
  }, [audio]);

  return {
    ...state,
    togglePlay,
  };
};
