import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { MusicTrack } from '@/hooks/useMusicLibrary';

interface MusicPlayerContextType {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  playTrack: (track: MusicTrack, urlResolver?: (id: string) => Promise<string | null>) => Promise<void>;
  playNext: (urlResolver?: (id: string) => Promise<string | null>) => Promise<void>;
  playPrevious: (urlResolver?: (id: string) => Promise<string | null>) => Promise<void>;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: boolean) => void;
  setPlaylist: (tracks: MusicTrack[]) => void;
  playlist: MusicTrack[];
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
};

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export const MusicPlayerProvider: React.FC<MusicPlayerProviderProps> = ({ children }) => {
  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const updateMediaSession = (track: MusicTrack) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: track.artwork ? [{ src: track.artwork, sizes: '512x512', type: 'image/jpeg' }] : undefined,
      });
    }
  };

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(error => console.error('Error playing track:', error));
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const playTrack = async (track: MusicTrack, urlResolver?: (id: string) => Promise<string | null>) => {
    if (audioRef.current && urlResolver) {
      const url = await urlResolver(track.id);
      if (url) {
        setCurrentTrack(track);
        audioRef.current.src = url;
        audioRef.current.volume = volume;
        updateMediaSession(track);
        play();
      }
    }
  };

  const playNext = async (urlResolver?: (id: string) => Promise<string | null>) => {
    if (playlist.length === 0 || !currentTrack || !urlResolver) return;

    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    let nextIndex;

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    await playTrack(playlist[nextIndex], urlResolver);
  };

  const playPrevious = async (urlResolver?: (id: string) => Promise<string | null>) => {
    if (playlist.length === 0 || !currentTrack || !urlResolver) return;

    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;

    await playTrack(playlist[prevIndex], urlResolver);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
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
    setIsPlaying(false);
    if (repeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        play();
      }
    }
  };

  useEffect(() => {
    (window as any).musicPlayerContext = {
      play,
      pause,
      isPlaying,
    };
  }, [isPlaying]);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        shuffle,
        repeat,
        audioRef,
        play,
        pause,
        togglePlayPause,
        playTrack,
        playNext,
        playPrevious,
        seek,
        setVolume,
        setShuffle,
        setRepeat,
        setPlaylist,
        playlist,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
    </MusicPlayerContext.Provider>
  );
};
