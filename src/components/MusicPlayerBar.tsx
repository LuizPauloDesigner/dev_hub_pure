import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useApp } from '@/contexts/AppContext';
import { useMusicLibrary } from '@/hooks/useMusicLibrary';

export const MusicPlayerBar = () => {
  const { getAllTracks } = useMusicLibrary();
  const tracks = getAllTracks();

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setPlaylist,
    playTrack
  } = useMusicPlayer();

  const { getTrackUrl } = useMusicLibrary();

  const handlePlayPrevious = () => playPrevious(getTrackUrl);
  const handlePlayNext = () => playNext(getTrackUrl);

  const { setCurrentTab } = useApp();
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem('mini-player-visible');
    return saved !== 'false';
  });

  // Atualizar playlist quando tracks mudarem
  useEffect(() => {
    if (tracks.length > 0) {
      setPlaylist(tracks);
    }
  }, [tracks, setPlaylist]);

  useEffect(() => {
    localStorage.setItem('mini-player-visible', String(isVisible));
  }, [isVisible]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isVisible) {
    return (
      <div className="w-full bg-card border-b border-primary/20 h-[24px] flex-shrink-0">
        <button
          onClick={() => setIsVisible(true)}
          className="w-full h-full py-1 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          <ChevronDown className="h-3 w-3" />
          Player
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-card border-b border-primary/20 flex-shrink-0">
      <div className="px-3 py-2">
        {/* Compact layout for extension */}
        <div className="flex items-center gap-2">
          {/* Album Art & Track Info */}
          <button
            onClick={() => setCurrentTab('musica')}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity flex-1"
          >
            <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
              {currentTrack?.artwork ? (
                <img
                  src={currentTrack.artwork}
                  alt={currentTrack.album}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Music className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-medium text-foreground truncate max-w-[100px]">
                {currentTrack?.title || 'Nenhuma música'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                {currentTrack?.artist || 'Selecione'}
              </p>
            </div>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPrevious}
              className="h-7 w-7 hover:bg-primary/10"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="icon"
              onClick={togglePlayPause}
              className="h-8 w-8 bg-primary hover:bg-primary/90"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayNext}
              className="h-7 w-7 hover:bg-primary/10"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Hide Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
            className="h-7 w-7 hover:bg-primary/10"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-muted-foreground w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative group">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={(val) => seek(val[0])}
              className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                "[&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5"
              )}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
