import { Music, Plus, Trash2, Upload, Folder, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { useMusicLibrary } from '@/hooks/useMusicLibrary';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

export const MusicPlayer = () => {
  const {
    playlists,
    tracks,
    isLoading,
    isConnected,
    addTracksToPlaylist,
    createPlaylist,
    removeTrack,
    removePlaylist,
    clearLibrary,
    getTrackUrl
  } = useMusicLibrary();

  const { playTrack, currentTrack, isPlaying, setPlaylist } = useMusicPlayer();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      const playlistId = createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreateDialogOpen(false);
      setSelectedPlaylist(playlistId);
    }
  };

  const handleAddTracks = (playlistId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      addTracksToPlaylist(playlistId, files);
    }
  };

  const currentPlaylist = useMemo(() => {
    const pl = selectedPlaylist
      ? playlists.find(p => p.id === selectedPlaylist)
      : playlists[0];

    if (!pl) return null;

    return {
      ...pl,
      resolvedTracks: pl.trackIds.map(id => tracks[id]).filter(Boolean)
    };
  }, [playlists, selectedPlaylist, tracks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Music className="h-16 w-16 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Iniciando biblioteca...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center max-w-2xl px-4">
          <Music className="h-24 w-24 text-muted-foreground/20 mb-6 mx-auto" />
          <h2 className="text-2xl font-bold mb-3">Biblioteca de Músicas</h2>
          <p className="text-muted-foreground mb-2 max-w-md mx-auto">
            Sua música, totalmente privada e persistente em seu navegador.
          </p>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Sua biblioteca é salva localmente (IndexedDB). Não usamos nuvem para seus arquivos de áudio por privacidade e performance.
          </p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                <Plus className="h-5 w-5 mr-2" />
                Criar Primeira Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Playlist</DialogTitle>
                <DialogDescription>Dê um nome para sua coleção</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist-name">Nome da Playlist</Label>
                  <Input
                    id="playlist-name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Ex: Coding Mood, LoFi, Rock..."
                    autoFocus
                  />
                </div>
                <Button onClick={handleCreatePlaylist} className="w-full">Criar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">🎵 Biblioteca</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova Playlist
          </Button>
          <Button onClick={clearLibrary} variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-2" /> Limpar Biblioteca
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Suas Playlists</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-1">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => setSelectedPlaylist(playlist.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center gap-3 ${(selectedPlaylist === playlist.id || (!selectedPlaylist && playlist === playlists[0]))
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'hover:bg-muted'
                      }`}
                  >
                    <Folder className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate font-medium">{playlist.name}</span>
                    <span className="text-[10px] tabular-nums opacity-60 bg-background/20 px-1.5 py-0.5 rounded-full">
                      {playlist.trackIds.length}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-none shadow-xl">
          <CardHeader className="p-6 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{currentPlaylist?.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentPlaylist?.trackIds.length || 0} música(s) salva(s)
                </p>
              </div>
              {currentPlaylist && (
                <div className="flex gap-2">
                  <Label htmlFor={`upload-${currentPlaylist.id}`} className="cursor-pointer">
                    <Button variant="secondary" size="sm" asChild>
                      <span><Upload className="h-4 w-4 mr-2" /> Importar</span>
                    </Button>
                    <Input
                      id={`upload-${currentPlaylist.id}`}
                      type="file"
                      accept="audio/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAddTracks(currentPlaylist.id, e)}
                    />
                  </Label>
                  <Button variant="ghost" size="sm" onClick={() => removePlaylist(currentPlaylist.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {currentPlaylist && currentPlaylist.resolvedTracks.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-22rem)] px-2">
                <div className="space-y-2">
                  {currentPlaylist.resolvedTracks.map((track) => {
                    const isCurrentTrack = currentTrack?.id === track.id;
                    const isTrackPlaying = isCurrentTrack && isPlaying;

                    return (
                      <div
                        key={track.id}
                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all group ${isCurrentTrack ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50 border-transparent'
                          }`}
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg shadow-sm border bg-muted">
                          {track.artwork ? (
                            <img src={track.artwork} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Music className="h-full w-full p-3 text-muted-foreground/40" />
                          )}
                          <Button
                            variant="primary"
                            size="icon"
                            className={`absolute inset-0 h-full w-full p-0 bg-primary/80 backdrop-blur-sm transition-opacity ${isCurrentTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                            onClick={() => {
                              setPlaylist(currentPlaylist.resolvedTracks);
                              playTrack(track, getTrackUrl);
                            }}
                          >
                            {isTrackPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${isCurrentTrack ? 'text-primary' : ''}`}>
                            {track.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate font-medium">
                            {track.artist} <span className="mx-1 opacity-50">•</span> {track.album}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            {track.name.split('.').pop()}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => removeTrack(currentPlaylist.id, track.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 mb-6">
                  <Music className="h-10 w-10 text-muted-foreground/20" />
                </div>
                <h3 className="text-lg font-medium">Sua playlist está vazia</h3>
                <p className="text-sm text-muted-foreground mb-8">Arraste seus arquivos para começar</p>
                <Label htmlFor={`upload-${currentPlaylist?.id}-empty`} className="cursor-pointer">
                  <Button variant="outline" className="px-10 border-dashed border-2" asChild>
                    <span><Upload className="h-4 w-4 mr-2" /> Adicionar Músicas</span>
                  </Button>
                  <Input
                    id={`upload-${currentPlaylist?.id}-empty`}
                    type="file"
                    accept="audio/*"
                    multiple
                    className="hidden"
                    onChange={(e) => currentPlaylist && handleAddTracks(currentPlaylist.id, e)}
                  />
                </Label>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-gradient-to-r from-muted/50 via-card to-muted/50 rounded-2xl border p-4 px-8 flex items-center justify-center gap-12 text-sm text-muted-foreground font-medium">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary opacity-60" />
          <span>{playlists.length} Playlists</span>
        </div>
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-primary opacity-60" />
          <span>{Object.keys(tracks).length} Músicas Salvas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>Biblioteca Persistente Ativa</span>
        </div>
      </div>
    </div>
  );
};
