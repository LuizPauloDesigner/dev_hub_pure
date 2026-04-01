import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '@/services/db';

export interface MusicTrack {
  id: string;
  name: string;
  title: string;
  artist: string;
  album: string;
  artwork?: string;
  playlistId: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

// Memory-only cache for object URLs to prevent leaks
const blobUrlCache: Record<string, string> = {};

export const useMusicLibrary = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tracks, setTracks] = useState<Record<string, MusicTrack>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const savedPlaylists = localStorage.getItem('musicPlaylists');
        const savedTracks = localStorage.getItem('musicTracksMetadata');

        if (savedPlaylists) setPlaylists(JSON.parse(savedPlaylists));
        if (savedTracks) setTracks(JSON.parse(savedTracks));
      } catch (error) {
        console.error('Error loading music library:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLibrary();
  }, []);

  // 2. Persistence
  useEffect(() => {
    localStorage.setItem('musicPlaylists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('musicTracksMetadata', JSON.stringify(tracks));
  }, [tracks]);

  // 3. Helper to get/create Blob URL
  const getTrackUrl = async (trackId: string): Promise<string | null> => {
    if (blobUrlCache[trackId]) return blobUrlCache[trackId];

    try {
      const fileData: any = await db.getAll('music').then(all => (all as any[]).find(m => m.id === trackId));
      if (fileData && fileData.file) {
        const url = URL.createObjectURL(fileData.file);
        blobUrlCache[trackId] = url;
        return url;
      }
    } catch (err) {
      console.error('Error getting track URL:', err);
    }
    return null;
  };

  const extractMetadata = async (file: File): Promise<Partial<MusicTrack>> => {
    return new Promise((resolve) => {
      // @ts-ignore
      if (typeof window.jsmediatags === 'undefined') {
        resolve({
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Artista Desconhecido',
          album: 'Álbum Desconhecido',
        });
        return;
      }

      // @ts-ignore
      window.jsmediatags.read(file, {
        onSuccess: (tag: any) => {
          const tags = tag.tags;
          let artwork: string | undefined;

          if (tags.picture) {
            const { data, format } = tags.picture;
            const byteArray = new Uint8Array(data);
            const blob = new Blob([byteArray], { type: format });
            artwork = URL.createObjectURL(blob);
          }

          resolve({
            title: tags.title || file.name.replace(/\.[^/.]+$/, ''),
            artist: tags.artist || 'Artista Desconhecido',
            album: tags.album || 'Álbum Desconhecido',
            artwork,
          });
        },
        onError: () => {
          resolve({
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Artista Desconhecido',
            album: 'Álbum Desconhecido',
          });
        },
      });
    });
  };

  const addTracksToPlaylist = async (playlistId: string, files: FileList) => {
    try {
      setIsLoading(true);
      const newTracks: MusicTrack[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (/\.(mp3|m4a|ogg|wav|flac)$/i.test(file.name)) {
          const metadata = await extractMetadata(file);
          const trackId = `track-${Date.now()}-${i}`;

          const track: MusicTrack = {
            id: trackId,
            name: file.name,
            title: metadata.title || file.name,
            artist: metadata.artist || 'Artista Desconhecido',
            album: metadata.album || 'Álbum Desconhecido',
            artwork: metadata.artwork,
            playlistId,
          };

          // Store file in IndexedDB
          await db.put('music', { id: trackId, file });

          newTracks.push(track);
        }
      }

      if (newTracks.length === 0) {
        toast.error('Nenhum arquivo de áudio válido encontrado');
        return;
      }

      // Update state
      const trackMap = { ...tracks };
      newTracks.forEach(t => trackMap[t.id] = t);
      setTracks(trackMap);

      setPlaylists(prev => prev.map(p =>
        p.id === playlistId
          ? { ...p, trackIds: [...p.trackIds, ...newTracks.map(t => t.id)] }
          : p
      ));

      toast.success(`${newTracks.length} música(s) adicionada(s)`);
    } catch (error) {
      console.error('Error adding tracks:', error);
      toast.error('Erro ao salvar as músicas localmente');
    } finally {
      setIsLoading(false);
    }
  };

  const createPlaylist = (name: string) => {
    const id = `pl-${Date.now()}`;
    const newPlaylist: Playlist = {
      id,
      name,
      trackIds: [],
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    toast.success(`Playlist "${name}" criada`);
    return id;
  };

  const removeTrack = async (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId) } : p
    ));

    // Revoke URL if cached
    if (blobUrlCache[trackId]) {
      URL.revokeObjectURL(blobUrlCache[trackId]);
      delete blobUrlCache[trackId];
    }

    // Optional: Only delete from DB if not in any other playlist
    // For simplicity, we delete it here
    await db.delete('music', trackId);

    setTracks(prev => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });

    toast.success('Música removida');
  };

  const removePlaylist = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
      for (const tId of playlist.trackIds) {
        await removeTrack(playlistId, tId);
      }
    }
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    toast.success('Playlist removida');
  };

  const clearLibrary = async () => {
    setPlaylists([]);
    setTracks({});
    await db.clear('music');
    // Revoke all
    Object.values(blobUrlCache).forEach(url => URL.revokeObjectURL(url));
    Object.keys(blobUrlCache).forEach(k => delete blobUrlCache[k]);
    toast.info('Biblioteca limpa');
  };

  const getAllTracks = (): MusicTrack[] => {
    return Object.values(tracks);
  };

  return {
    playlists,
    tracks,
    isLoading,
    isConnected: playlists.length > 0,
    addTracksToPlaylist,
    createPlaylist,
    removeTrack,
    removePlaylist,
    clearLibrary,
    getTrackUrl,
    getAllTracks
  };
};
