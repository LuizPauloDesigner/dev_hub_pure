import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface VideoItem {
  id: string;
  file: File;
  name: string;
  url: string;
  title: string;
  thumbnail?: string;
  playlist: string;
}

export interface VideoPlaylist {
  id: string;
  name: string;
  videos: VideoItem[];
}

export const useVideoLibrary = () => {
  const [playlists, setPlaylists] = useState<VideoPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('videoPlaylists');
    if (saved) {
      try {
        setPlaylists(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar playlists de vídeo:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (playlists.length > 0) {
      localStorage.setItem('videoPlaylists', JSON.stringify(playlists));
    }
  }, [playlists]);

  const generateThumbnail = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        const url = URL.createObjectURL(file);
        video.src = url;

        video.onloadeddata = () => {
          video.currentTime = Math.min(1, video.duration / 4);
        };

        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            resolve(undefined);
          }
          URL.revokeObjectURL(url);
        };

        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(undefined);
        };
      } catch {
        resolve(undefined);
      }
    });
  };

  const addVideosToPlaylist = async (playlistId: string, files: FileList) => {
    try {
      setIsLoading(true);
      const newVideos: VideoItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (/\.(mp4|webm|ogg|mkv|avi|mov)$/i.test(file.name)) {
          const thumbnail = await generateThumbnail(file);
          newVideos.push({
            id: `${Date.now()}-${i}`,
            file,
            name: file.name,
            url: URL.createObjectURL(file),
            title: file.name.replace(/\.[^/.]+$/, ''),
            thumbnail,
            playlist: playlistId,
          });
        }
      }

      if (newVideos.length === 0) {
        toast.error('Nenhum arquivo de vídeo encontrado');
        return;
      }

      setPlaylists(prev => {
        const existing = prev.find(p => p.id === playlistId);
        if (existing) {
          return prev.map(p =>
            p.id === playlistId
              ? { ...p, videos: [...p.videos, ...newVideos] }
              : p
          );
        }
        return [...prev, { id: playlistId, name: playlistId, videos: newVideos }];
      });

      toast.success(`${newVideos.length} vídeo(s) adicionado(s)`);
    } catch (error) {
      console.error('Erro ao adicionar vídeos:', error);
      toast.error('Erro ao adicionar vídeos');
    } finally {
      setIsLoading(false);
    }
  };

  const createPlaylist = (name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    setPlaylists(prev => [...prev, { id, name, videos: [] }]);
    toast.success(`Playlist "${name}" criada`);
    return id;
  };

  const removeVideo = (playlistId: string, videoId: string) => {
    setPlaylists(prev =>
      prev.map(p =>
        p.id === playlistId
          ? { ...p, videos: p.videos.filter(v => v.id !== videoId) }
          : p
      )
    );
    toast.success('Vídeo removido');
  };

  const removePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    toast.success('Playlist removida');
  };

  const clearLibrary = () => {
    setPlaylists([]);
    localStorage.removeItem('videoPlaylists');
    toast.info('Biblioteca de vídeos limpa');
  };

  return {
    playlists,
    isLoading,
    isConnected: playlists.length > 0,
    addVideosToPlaylist,
    createPlaylist,
    removeVideo,
    removePlaylist,
    clearLibrary,
  };
};
